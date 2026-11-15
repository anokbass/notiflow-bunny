import { logger, patcher } from "@vendetta";
import { findByStoreName } from "@vendetta/metro";
import { FluxDispatcher } from "@vendetta/metro/common";
import { showToast } from "@vendetta/ui/toasts";
import Settings from "./Settings";
import { initStorage, storage } from "./storage";

type Notice = {
    id: string;
    author: string;
    guild: string;
    channel: string;
    preview: string;
    categories: string[];
    at: number;
};

let unpatch: (() => void) | null = null;
const seenMessageIds = new Set<string>();
let lastPopupAt = 0;
const POPUP_COOLDOWN_MS = 900;
const MAX_INBOX_ITEMS = 100;

function ownUserId(): string {
    try {
        const userStore = findByStoreName("UserStore") as any;
        return userStore?.getCurrentUser?.()?.id ?? "";
    } catch {
        return "";
    }
}

function parseIds(value: unknown): Set<string> {
    return new Set(
        String(value ?? "")
            .split(/[\s,;]+/)
            .map((part) => part.trim())
            .filter(Boolean),
    );
}

function getChannel(channelId: string): any {
    try {
        return (findByStoreName("ChannelStore") as any)?.getChannel?.(channelId);
    } catch {
        return undefined;
    }
}

function getGuildName(guildId: string, channel: any): string {
    if (!guildId) return "DM";
    try {
        const guildStore = findByStoreName("GuildStore") as any;
        return guildStore?.getGuild?.(guildId)?.name || channel?.guild_name || "Servidor";
    } catch {
        return channel?.guild_name || "Servidor";
    }
}

function isDirectMessage(message: any, channel: any, guildId: string): boolean {
    const type = Number(channel?.type);
    if (type === 1 || type === 3) return true;
    if (guildId) return false;
    return Boolean(channel);
}

function isMentionOfCurrentUser(message: any, userId: string): boolean {
    if (!userId) return false;
    const mentions = Array.isArray(message?.mentions) ? message.mentions : [];
    if (mentions.some((mention: any) => String(mention?.id ?? mention) === userId)) return true;
    const content = typeof message?.content === "string" ? message.content : "";
    return new RegExp(`<@!?${userId}>`).test(content);
}

function isReplyToCurrentUser(message: any, channelId: string, userId: string): boolean {
    if (!userId) return false;
    if (String(message?.referenced_message?.author?.id ?? "") === userId) return true;
    const referenceId = message?.message_reference?.message_id;
    if (!referenceId) return false;
    try {
        const messageStore = findByStoreName("MessageStore") as any;
        const referenced = messageStore?.getMessage?.(channelId, referenceId);
        return String(referenced?.author?.id ?? "") === userId;
    } catch {
        return false;
    }
}

function cleanPreview(content: unknown): string {
    const text = String(content ?? "").replace(/\s+/g, " ").trim();
    if (!text) return "(mensagem sem texto)";
    return text.length > 100 ? `${text.slice(0, 99)}…` : text;
}

function getCategories(message: any, channelId: string, userId: string, isDM: boolean): string[] {
    const categories: string[] = [];
    if (storage.notifyMentions && isMentionOfCurrentUser(message, userId)) categories.push("Menção");
    if (storage.notifyReplies && isReplyToCurrentUser(message, channelId, userId)) categories.push("Resposta");
    if (storage.notifyDMs && isDM) categories.push("DM");

    if (storage.notifyKeywords) {
        const text = String(message?.content ?? "").toLocaleLowerCase();
        const keywords = String(storage.keywords ?? "")
            .split(/[\n,;]+/)
            .map((keyword) => keyword.trim().toLocaleLowerCase())
            .filter(Boolean);
        if (keywords.some((keyword) => text.includes(keyword))) categories.push("Palavra-chave");
    }
    return [...new Set(categories)];
}

function handleMessage(message: any): void {
    if (!storage.enabled || !message?.id || !message?.author?.id) return;
    const userId = ownUserId();
    if (!userId || String(message.author.id) === userId) return;

    const messageId = String(message.id);
    if (seenMessageIds.has(messageId)) return;
    seenMessageIds.add(messageId);
    if (seenMessageIds.size > 500) {
        const oldest = seenMessageIds.values().next().value;
        if (oldest) seenMessageIds.delete(oldest);
    }

    // Avoid alerting on older messages replayed while Discord loads channel history.
    const timestamp = Date.parse(message.timestamp ?? "");
    if (Number.isFinite(timestamp) && Date.now() - timestamp > 120_000) return;

    const channelId = String(message.channel_id ?? message.channelId ?? "");
    if (!channelId) return;
    const channel = getChannel(channelId);
    const guildId = String(message.guild_id ?? message.guildId ?? channel?.guild_id ?? channel?.guildId ?? "");
    const isDM = isDirectMessage(message, channel, guildId);

    const onlyGuilds = parseIds(storage.onlyGuildIds);
    const onlyChannels = parseIds(storage.onlyChannelIds);
    const ignoredUsers = parseIds(storage.ignoredUserIds);
    if (ignoredUsers.has(String(message.author.id))) return;
    if (onlyGuilds.size > 0 && !onlyGuilds.has(guildId)) return;
    if (onlyChannels.size > 0 && !onlyChannels.has(channelId)) return;

    const categories = getCategories(message, channelId, userId, isDM);
    if (categories.length === 0) return;

    const author = String(message.author.global_name ?? message.author.username ?? "Usuário");
    const guild = getGuildName(guildId, channel);
    const channelName = isDM ? "Mensagem direta" : String(channel?.name ?? "canal");
    const preview = cleanPreview(message.content);
    const notice: Notice = {
        id: messageId,
        author,
        guild,
        channel: channelName,
        preview,
        categories,
        at: Date.now(),
    };

    if (storage.saveInbox) {
        const previous = Array.isArray(storage.inbox) ? storage.inbox : [];
        storage.inbox = [notice, ...previous.filter((item: Notice) => item?.id !== messageId)].slice(0, MAX_INBOX_ITEMS);
    }

    if (storage.showPopups && Date.now() - lastPopupAt >= POPUP_COOLDOWN_MS) {
        lastPopupAt = Date.now();
        const shortPreview = preview.length > 58 ? `${preview.slice(0, 57)}…` : preview;
        try {
            showToast(`NotiFlow · ${categories.join(" / ")} · ${author}: ${shortPreview}`);
        } catch (error) {
            logger.error("[NotiFlow] Could not display popup:", error);
        }
    }
}

function onDispatch(args: any[]): void {
    const action = args?.[0];
    if (action?.type !== "MESSAGE_CREATE" || !action.message) return;
    try {
        handleMessage(action.message);
    } catch (error) {
        logger.error("[NotiFlow] Message filter failed:", error);
    }
}

export default {
    onLoad: () => {
        initStorage();
        if (unpatch) unpatch();
        unpatch = patcher.after("dispatch", FluxDispatcher, onDispatch);
        logger.log("[NotiFlow] Loaded. Local message filters are active.");
    },
    onUnload: () => {
        if (unpatch) unpatch();
        unpatch = null;
        seenMessageIds.clear();
        logger.log("[NotiFlow] Unloaded.");
    },
    settings: Settings,
};
