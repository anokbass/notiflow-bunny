import { storage } from "@vendetta/plugin";

const defaults = {
    enabled: true,
    showPopups: true,
    notifyMentions: true,
    notifyReplies: true,
    notifyDMs: true,
    notifyKeywords: false,
    keywords: "",
    onlyGuildIds: "",
    onlyChannelIds: "",
    ignoredUserIds: "",
    saveInbox: true,
    inbox: [] as any[],
};

export function initStorage(): void {
    for (const [key, value] of Object.entries(defaults)) {
        if ((storage as any)[key] === undefined) (storage as any)[key] = value;
    }
    if (!Array.isArray((storage as any).inbox)) (storage as any).inbox = [];
}

export { storage };
