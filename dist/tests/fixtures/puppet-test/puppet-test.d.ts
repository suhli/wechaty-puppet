import { Puppet, FileBox, ContactPayload, FriendshipPayload, ImageType, MiniProgramPayload, UrlLinkPayload, MessagePayload, MessageQueryFilter, RoomInvitationPayload, RoomPayload, RoomMemberPayload, RoomQueryFilter, ContactQueryFilter } from '../../../src/mod';
/**
 * expose to public for internal methods:
 */
import { MessagePayloadFilterFunction } from '../../../src/schemas/message';
import { RoomPayloadFilterFunction } from '../../../src/schemas/room';
import { ContactPayloadFilterFunction } from '../../../src/schemas/contact';
export declare class PuppetTest extends Puppet {
    start(): Promise<void>;
    stop(): Promise<void>;
    ding(data?: string): Promise<void>;
    logout(): Promise<void>;
    /**
     *
     * ContactSelf
     *
     *
     */
    contactSelfQRCode(): Promise<string>;
    contactSelfName(name: string): Promise<void>;
    contactSelfSignature(signature: string): Promise<void>;
    /**
     *
     * Tag
     *
     */
    tagContactAdd(tagId: string, contactId: string): Promise<void>;
    tagContactRemove(tagId: string, contactId: string): Promise<void>;
    tagContactDelete(tagId: string): Promise<void>;
    tagContactList(contactId?: string): Promise<string[]>;
    /**
     *
     * Contact
     *
     */
    contactAlias(contactId: string): Promise<string>;
    contactAlias(contactId: string, alias: string | null): Promise<void>;
    contactAvatar(contactId: string): Promise<FileBox>;
    contactAvatar(contactId: string, file: FileBox): Promise<void>;
    contactPhone(contactId: string, phoneList: string[]): Promise<void>;
    contactList(): Promise<string[]>;
    contactCorporationRemark(contactId: string, corporationRemark: string | null): Promise<void>;
    contactDescription(contactId: string, description: string | null): Promise<void>;
    contactRawPayload(id: string): Promise<any>;
    contactRawPayloadParser(rawPayload: any): Promise<ContactPayload>;
    /**
     *
     * Friendship
     *
     */
    friendshipRawPayload(id: string): Promise<any>;
    friendshipRawPayloadParser(rawPayload: any): Promise<FriendshipPayload>;
    friendshipSearchPhone(phone: string): Promise<null | string>;
    friendshipSearchWeixin(weixin: string): Promise<null | string>;
    friendshipAdd(contactId: string, hello?: string): Promise<void>;
    friendshipAccept(friendshipId: string): Promise<void>;
    /**
     *
     * Message
     *
     */
    messageContact(messageId: string): Promise<string>;
    messageFile(messageId: string): Promise<FileBox>;
    messageImage(messageId: string, imageType: ImageType): Promise<FileBox>;
    messageMiniProgram(messageId: string): Promise<MiniProgramPayload>;
    messageUrl(messageId: string): Promise<UrlLinkPayload>;
    messageForward(conversationId: string, messageId: string): Promise<void | string>;
    messageSendContact(conversationId: string, contactId: string): Promise<void | string>;
    messageSendFile(conversationId: string, file: FileBox): Promise<void | string>;
    messageSendText(conversationId: string, text: string): Promise<void | string>;
    messageSendUrl(conversationId: string, urlLinkPayload: UrlLinkPayload): Promise<void | string>;
    messageSendMiniProgram(conversationId: string, miniProgramPayload: MiniProgramPayload): Promise<void | string>;
    messageRawPayload(id: string): Promise<any>;
    messageRawPayloadParser(rawPayload: any): Promise<MessagePayload>;
    messageRecall(messageId: string): Promise<boolean>;
    /**
     *
     * Room Invitation
     *
     */
    roomInvitationAccept(_: string): Promise<void>;
    roomInvitationRawPayload(roomInvitationId: string): Promise<any>;
    roomInvitationRawPayloadParser(rawPayload: any): Promise<RoomInvitationPayload>;
    /**
     *
     * Room
     *
     */
    roomAnnounce(roomId: string): Promise<string>;
    roomAnnounce(roomId: string, text: string): Promise<void>;
    roomAdd(roomId: string, contactId: string): Promise<void>;
    roomAvatar(roomId: string): Promise<FileBox>;
    roomCreate(contactIdList: string[], topic?: string): Promise<string>;
    roomDel(roomId: string, contactId: string): Promise<void>;
    roomQuit(roomId: string): Promise<void>;
    roomQRCode(roomId: string): Promise<string>;
    roomTopic(roomId: string): Promise<string>;
    roomTopic(roomId: string, topic: string): Promise<void>;
    roomList(): Promise<string[]>;
    roomMemberList(roomId: string): Promise<string[]>;
    roomRawPayload(id: string): Promise<any>;
    roomRawPayloadParser(rawPayload: any): Promise<RoomPayload>;
    roomMemberRawPayload(roomId: string, contactId: string): Promise<any>;
    roomMemberRawPayloadParser(rawPayload: any): Promise<RoomMemberPayload>;
    /**
     * expose to public for internal methods:
     */
    messageQueryFilterFactory(query: MessageQueryFilter): MessagePayloadFilterFunction;
    roomQueryFilterFactory(query: RoomQueryFilter): RoomPayloadFilterFunction;
    contactQueryFilterFactory(query: ContactQueryFilter): ContactPayloadFilterFunction;
}
export default PuppetTest;
//# sourceMappingURL=puppet-test.d.ts.map