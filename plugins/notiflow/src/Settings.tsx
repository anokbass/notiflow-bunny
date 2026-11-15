import { React, ReactNative } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "./storage";

const { FormSection, FormRow, FormSwitch, FormInput, FormDivider } = Forms;
const { ScrollView, View, Text, TouchableOpacity } = ReactNative;

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (next: boolean) => void }) {
    return <FormRow label={label} trailing={<FormSwitch value={value} onValueChange={onChange} />} />;
}

function NotificationCard({ item }: { item: any; key?: string }) {
    const stamp = new Date(Number(item?.at) || Date.now()).toLocaleTimeString();
    const place = [item?.guild, item?.channel].filter(Boolean).join(" · ");
    return (
        <View style={{ paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#302c31" }}>
            <Text style={{ color: "#f5f2f3", fontSize: 14, fontWeight: "700" }}>
                {String(item?.author ?? "Usuário")}  ·  {Array.isArray(item?.categories) ? item.categories.join(" / ") : "Aviso"}
            </Text>
            <Text style={{ color: "#d8d2d6", fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                {String(item?.preview ?? "(sem prévia salva)")}
            </Text>
            <Text style={{ color: "#928a90", fontSize: 11, marginTop: 4 }}>
                {place || "Mensagem"}  ·  {stamp}
            </Text>
        </View>
    );
}

export default function SettingsPanel() {
    useProxy(storage);
    const inbox = Array.isArray(storage.inbox) ? storage.inbox : [];

    return (
        <ScrollView keyboardShouldPersistTaps="handled">
            <FormSection title="NotiFlow · Preferências">
                <SwitchRow label="Ativar filtros do NotiFlow" value={!!storage.enabled} onChange={(v) => { storage.enabled = v; }} />
                <FormDivider />
                <SwitchRow label="Mostrar pop-ups dentro do Discord" value={!!storage.showPopups} onChange={(v) => { storage.showPopups = v; }} />
                <FormDivider />
                <SwitchRow label="Menções diretas a mim" value={!!storage.notifyMentions} onChange={(v) => { storage.notifyMentions = v; }} />
                <FormDivider />
                <SwitchRow label="Respostas às minhas mensagens" value={!!storage.notifyReplies} onChange={(v) => { storage.notifyReplies = v; }} />
                <FormDivider />
                <SwitchRow label="Mensagens diretas (DMs)" value={!!storage.notifyDMs} onChange={(v) => { storage.notifyDMs = v; }} />
                <FormDivider />
                <SwitchRow label="Palavras-chave escolhidas por mim" value={!!storage.notifyKeywords} onChange={(v) => { storage.notifyKeywords = v; }} />
                {storage.notifyKeywords && <>
                    <FormDivider />
                    <FormInput
                        title="Palavras-chave"
                        value={String(storage.keywords ?? "")}
                        onChange={(v: string) => { storage.keywords = v; }}
                    />
                    <FormRow label="Separe termos por vírgulas. A busca não diferencia maiúsculas de minúsculas." />
                </>}
            </FormSection>

            <FormSection title="Filtrar por local ou pessoa">
                <FormInput
                    title="Somente estes IDs de servidor (opcional)"
                    value={String(storage.onlyGuildIds ?? "")}
                    onChange={(v: string) => { storage.onlyGuildIds = v; }}
                />
                <FormRow label="Vazio = todos os servidores. Separe IDs por vírgula ou espaço." />
                <FormDivider />
                <FormInput
                    title="Somente estes IDs de canal (opcional)"
                    value={String(storage.onlyChannelIds ?? "")}
                    onChange={(v: string) => { storage.onlyChannelIds = v; }}
                />
                <FormRow label="Vazio = todos os canais. Use junto com o filtro de servidor se quiser." />
                <FormDivider />
                <FormInput
                    title="Ignorar estes IDs de usuário"
                    value={String(storage.ignoredUserIds ?? "")}
                    onChange={(v: string) => { storage.ignoredUserIds = v; }}
                />
                <FormRow label="Mensagens dessas pessoas não geram alertas. Separe IDs por vírgula ou espaço." />
            </FormSection>

            <FormSection title="Painel de avisos">
                <SwitchRow label="Salvar avisos recentes neste painel" value={!!storage.saveInbox} onChange={(v) => { storage.saveInbox = v; if (!v) storage.inbox = []; }} />
                <FormRow label="O histórico é local e mantém no máximo 100 avisos. Desative para não guardar prévias." />
                <FormDivider />
                <TouchableOpacity
                    onPress={() => { storage.inbox = []; }}
                    style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                >
                    <Text style={{ color: "#e33b53", fontSize: 14, fontWeight: "700" }}>Limpar histórico</Text>
                </TouchableOpacity>
                <FormRow label={`${inbox.length} de 100 avisos recentes`} />
            </FormSection>

            <FormSection title="Recentes">
                {inbox.length === 0
                    ? <FormRow label="Nenhum aviso salvo ainda. As regras selecionadas aparecem aqui quando uma nova mensagem corresponder." />
                    : inbox.slice(0, 50).map((item: any) => <NotificationCard key={String(item?.id)} item={item} />)}
            </FormSection>

            <FormSection title="Limites">
                <FormRow label="O NotiFlow só observa mensagens novas enquanto o cliente está aberto. Ele não altera nem bloqueia notificações push do Android/Discord." />
                <FormRow label="Nenhuma mensagem é enviada para fora do aparelho. Pré-visualizações salvas ficam no armazenamento local do plugin." />
            </FormSection>
        </ScrollView>
    );
}
