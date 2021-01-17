"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuppetTest = void 0;
const mod_1 = require("../../../src/mod");
class PuppetTest extends mod_1.Puppet {
    start() {
        const _super = Object.create(null, {
            start: { get: () => super.start }
        });
        return __awaiter(this, void 0, void 0, function* () { return _super.start.call(this); });
    }
    stop() {
        const _super = Object.create(null, {
            stop: { get: () => super.stop }
        });
        return __awaiter(this, void 0, void 0, function* () { return _super.stop.call(this); });
    }
    ding(data) {
        return __awaiter(this, void 0, void 0, function* () { return data; });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    /**
     *
     * ContactSelf
     *
     *
     */
    contactSelfQRCode() {
        return __awaiter(this, void 0, void 0, function* () { return ''; });
    }
    contactSelfName(name) {
        return __awaiter(this, void 0, void 0, function* () { return void name; });
    }
    contactSelfSignature(signature) {
        return __awaiter(this, void 0, void 0, function* () { return void signature; });
    }
    /**
     *
     * Tag
     *
     */
    tagContactAdd(tagId, contactId) {
        return __awaiter(this, void 0, void 0, function* () { return void { contactId, tagId }; });
    }
    tagContactRemove(tagId, contactId) {
        return __awaiter(this, void 0, void 0, function* () { return void { contactId, tagId }; });
    }
    tagContactDelete(tagId) {
        return __awaiter(this, void 0, void 0, function* () { return void { tagId }; });
    }
    tagContactList(contactId) {
        return __awaiter(this, void 0, void 0, function* () { return [contactId || '']; });
    }
    contactAlias(contactId, alias) {
        return __awaiter(this, void 0, void 0, function* () { return { alias, contactId }; });
    }
    contactAvatar(contactId, file) {
        return __awaiter(this, void 0, void 0, function* () { return { contactId, file }; });
    }
    contactPhone(contactId, phoneList) {
        return __awaiter(this, void 0, void 0, function* () { return { contactId, phoneList }; });
    }
    contactList() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    contactCorporationRemark(contactId, corporationRemark) {
        return __awaiter(this, void 0, void 0, function* () { return { contactId, corporationRemark }; });
    }
    contactDescription(contactId, description) {
        return __awaiter(this, void 0, void 0, function* () { return { contactId, description }; });
    }
    contactRawPayload(id) {
        return __awaiter(this, void 0, void 0, function* () { return { id }; });
    }
    contactRawPayloadParser(rawPayload) {
        return __awaiter(this, void 0, void 0, function* () { return { rawPayload }; });
    }
    /**
     *
     * Friendship
     *
     */
    friendshipRawPayload(id) {
        return __awaiter(this, void 0, void 0, function* () { return { id }; });
    }
    friendshipRawPayloadParser(rawPayload) {
        return __awaiter(this, void 0, void 0, function* () { return rawPayload; });
    }
    friendshipSearchPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () { return phone; });
    }
    friendshipSearchWeixin(weixin) {
        return __awaiter(this, void 0, void 0, function* () { return weixin; });
    }
    friendshipAdd(contactId, hello) {
        return __awaiter(this, void 0, void 0, function* () { return { contactId, hello }; });
    }
    friendshipAccept(friendshipId) {
        return __awaiter(this, void 0, void 0, function* () { return { friendshipId }; });
    }
    /**
     *
     * Message
     *
     */
    messageContact(messageId) {
        return __awaiter(this, void 0, void 0, function* () { return { messageId }; });
    }
    messageFile(messageId) {
        return __awaiter(this, void 0, void 0, function* () { return { messageId }; });
    }
    messageImage(messageId, imageType) {
        return __awaiter(this, void 0, void 0, function* () { return { imageType, messageId }; });
    }
    messageMiniProgram(messageId) {
        return __awaiter(this, void 0, void 0, function* () { return { messageId }; });
    }
    messageUrl(messageId) {
        return __awaiter(this, void 0, void 0, function* () { return { messageId }; });
    }
    messageForward(conversationId, messageId) {
        return __awaiter(this, void 0, void 0, function* () { return { conversationId, messageId }; });
    }
    messageSendContact(conversationId, contactId) {
        return __awaiter(this, void 0, void 0, function* () { return { contactId, conversationId }; });
    }
    messageSendFile(conversationId, file) {
        return __awaiter(this, void 0, void 0, function* () { return { conversationId, file }; });
    }
    messageSendText(conversationId, text) {
        return __awaiter(this, void 0, void 0, function* () { return { conversationId, text }; });
    }
    messageSendUrl(conversationId, urlLinkPayload) {
        return __awaiter(this, void 0, void 0, function* () { return { conversationId, urlLinkPayload }; });
    }
    messageSendMiniProgram(conversationId, miniProgramPayload) {
        return __awaiter(this, void 0, void 0, function* () { return { conversationId, miniProgramPayload }; });
    }
    messageRawPayload(id) {
        return __awaiter(this, void 0, void 0, function* () { return { id }; });
    }
    messageRawPayloadParser(rawPayload) {
        return __awaiter(this, void 0, void 0, function* () { return { rawPayload }; });
    }
    messageRecall(messageId) {
        return __awaiter(this, void 0, void 0, function* () { return { messageId }; });
    }
    /**
     *
     * Room Invitation
     *
     */
    roomInvitationAccept(_) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    roomInvitationRawPayload(roomInvitationId) {
        return __awaiter(this, void 0, void 0, function* () { return { roomInvitationId }; });
    }
    roomInvitationRawPayloadParser(rawPayload) {
        return __awaiter(this, void 0, void 0, function* () { return rawPayload; });
    }
    roomAnnounce(roomId, text) {
        return __awaiter(this, void 0, void 0, function* () { return { roomId, text }; });
    }
    roomAdd(roomId, contactId) {
        return __awaiter(this, void 0, void 0, function* () { return { contactId, roomId }; });
    }
    roomAvatar(roomId) {
        return __awaiter(this, void 0, void 0, function* () { return { roomId }; });
    }
    roomCreate(contactIdList, topic) {
        return __awaiter(this, void 0, void 0, function* () { return { contactIdList, topic }; });
    }
    roomDel(roomId, contactId) {
        return __awaiter(this, void 0, void 0, function* () { return { contactId, roomId }; });
    }
    roomQuit(roomId) {
        return __awaiter(this, void 0, void 0, function* () { return { roomId }; });
    }
    roomQRCode(roomId) {
        return __awaiter(this, void 0, void 0, function* () { return { roomId }; });
    }
    roomTopic(roomId, topic) {
        return __awaiter(this, void 0, void 0, function* () { return { roomId, topic }; });
    }
    roomList() {
        return __awaiter(this, void 0, void 0, function* () { return {}; });
    }
    roomMemberList(roomId) {
        return __awaiter(this, void 0, void 0, function* () { return { roomId }; });
    }
    roomRawPayload(id) {
        return __awaiter(this, void 0, void 0, function* () { return { id }; });
    }
    roomRawPayloadParser(rawPayload) {
        return __awaiter(this, void 0, void 0, function* () { return { rawPayload }; });
    }
    roomMemberRawPayload(roomId, contactId) {
        return __awaiter(this, void 0, void 0, function* () { return { contactId, roomId }; });
    }
    roomMemberRawPayloadParser(rawPayload) {
        return __awaiter(this, void 0, void 0, function* () { return rawPayload; });
    }
    /**
     * expose to public for internal methods:
     */
    messageQueryFilterFactory(query) {
        return super.messageQueryFilterFactory(query);
    }
    roomQueryFilterFactory(query) {
        return super.roomQueryFilterFactory(query);
    }
    contactQueryFilterFactory(query) {
        return super.contactQueryFilterFactory(query);
    }
}
exports.PuppetTest = PuppetTest;
exports.default = PuppetTest;
//# sourceMappingURL=puppet-test.js.map