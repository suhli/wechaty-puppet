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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Puppet = void 0;
/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   @copyright 2016-2018 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
const quick_lru_1 = __importDefault(require("quick-lru"));
const watchdog_1 = require("watchdog");
const state_switch_1 = require("state-switch");
const rx_queue_1 = require("rx-queue");
const hot_import_1 = require("hot-import");
const normalize_package_data_1 = __importDefault(require("normalize-package-data"));
const read_pkg_up_1 = __importDefault(require("read-pkg-up"));
const config_1 = require("./config");
const message_1 = require("./schemas/message");
const puppet_1 = require("./schemas/puppet");
const payload_1 = require("./schemas/payload");
const throw_unsupported_error_1 = require("./throw-unsupported-error");
const events_1 = require("./events");
const DEFAULT_WATCHDOG_TIMEOUT = 60;
let PUPPET_COUNTER = 0;
/**
 *
 * Puppet Base Class
 *
 * See: https://github.com/Chatie/wechaty/wiki/Puppet
 *
 */
class Puppet extends events_1.PuppetEventEmitter {
    /**
     *
     *
     * Constructor
     *
     *
     */
    constructor(options = {}) {
        super();
        this.options = options;
        this.counter = PUPPET_COUNTER++;
        config_1.log.verbose('Puppet', 'constructor(%s) #%d', JSON.stringify(options), this.counter);
        this.state = new state_switch_1.StateSwitch(this.constructor.name, { log: config_1.log });
        this.memory = new config_1.MemoryCard(); // dummy memory
        this.memory.load() // load here is for testing only
            .then(() => undefined)
            .catch(e => config_1.log.warn('Puppet', 'constructor() memory.load() rejection: %s', e));
        /**
         * 1. Setup Watchdog
         *  puppet implementation class only need to do one thing:
         *  feed the watchdog by `this.emit('heartbeat', ...)`
         */
        const timeout = this.options.timeout || DEFAULT_WATCHDOG_TIMEOUT;
        config_1.log.verbose('Puppet', 'constructor() watchdog timeout set to %d seconds', timeout);
        this.watchdog = new watchdog_1.Watchdog(1000 * timeout, 'Puppet');
        /**
         * 2. Setup `reset` Event via a 1 second Throttle Queue:
         */
        this.resetThrottleQueue = new rx_queue_1.ThrottleQueue(1000);
        this.resetThrottleQueue.subscribe(reason => {
            config_1.log.silly('Puppet', 'constructor() resetThrottleQueue.subscribe() reason: "%s"', reason);
            this.reset(reason);
        });
        /**
         * 3. Setup LRU Caches
         */
        const lruOptions = (maxSize = 100) => ({ maxSize });
        this.cacheContactPayload = new quick_lru_1.default(lruOptions(3000));
        this.cacheFriendshipPayload = new quick_lru_1.default(lruOptions(100));
        this.cacheMessagePayload = new quick_lru_1.default(lruOptions(500));
        this.cacheRoomPayload = new quick_lru_1.default(lruOptions(500));
        this.cacheRoomInvitationPayload = new quick_lru_1.default(lruOptions(100));
        this.cacheRoomMemberPayload = new quick_lru_1.default(lruOptions(60 * 500));
        /**
         * 4. Load the package.json for Puppet Plugin version range matching
         *
         * For: dist/src/puppet/puppet.ts
         *  We need to up 3 times: ../../../package.json
         */
        try {
            const childClassPath = hot_import_1.callerResolve('.', __filename);
            config_1.log.verbose('Puppet', 'constructor() childClassPath=%s', childClassPath);
            this.childPkg = read_pkg_up_1.default.sync({ cwd: childClassPath }).packageJson;
        }
        catch (e) {
            config_1.log.error('Puppet', 'constructor() %s', e);
            throw e;
        }
        if (!this.childPkg) {
            throw new Error('Cannot found package.json for Puppet Plugin Module');
        }
        normalize_package_data_1.default(this.childPkg);
        this.feedDog = this.feedDog.bind(this);
        this.dogReset = this.dogReset.bind(this);
        this.throttleReset = this.throttleReset.bind(this);
    }
    toString() {
        return [
            'Puppet#',
            this.counter,
            '<',
            this.constructor.name,
            '>',
            '(',
            this.memory.name || '',
            ')',
        ].join('');
    }
    /**
     * Unref
     */
    unref() {
        config_1.log.verbose('Puppet', 'unref()');
        this.watchdog.unref();
    }
    /**
     * @private
     *
     * For used by Wechaty internal ONLY.
     */
    setMemory(memory) {
        config_1.log.verbose('Puppet', 'setMemory()');
        if (this.memory.name) {
            throw new Error('puppet has already had a named memory: ' + this.memory.name);
        }
        this.memory = memory;
    }
    /**
     *
     *
     * Start / Stop
     *
     *
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.on('heartbeat', this.feedDog);
            this.watchdog.on('reset', this.dogReset);
            this.on('reset', this.throttleReset);
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.removeListener('heartbeat', this.feedDog);
            this.watchdog.removeListener('reset', this.dogReset);
            this.removeListener('reset', this.throttleReset);
            this.watchdog.sleep();
            /**
             * FIXME: Huan(202008) clear cache when stop
             *  keep the cache as a temp workaround since wechaty-puppet-hostie has reconnect issue
             *  with un-cleared cache in wechaty-puppet will make the reconnect recoverable
             *
             * Related issue: https://github.com/wechaty/wechaty-puppet-hostie/issues/31
             */
            // this.cacheContactPayload.clear()
            // this.cacheFriendshipPayload.clear()
            // this.cacheMessagePayload.clear()
            // this.cacheRoomPayload.clear()
            // this.cacheRoomInvitationPayload.clear()
            // this.cacheRoomMemberPayload.clear()
        });
    }
    feedDog(payload) {
        this.watchdog.feed(payload);
    }
    dogReset(lastFood) {
        config_1.log.warn('Puppet', 'dogReset() reason: %s', JSON.stringify(lastFood));
        this.emit('reset', lastFood);
    }
    throttleReset(payload) {
        config_1.log.silly('Puppet', 'throttleReset() payload: "%s"', JSON.stringify(payload));
        if (this.resetThrottleQueue) {
            this.resetThrottleQueue.next(payload.data);
        }
        else {
            config_1.log.warn('Puppet', 'Drop reset since no resetThrottleQueue.');
        }
    }
    /**
     * Huan(201808):
     *  reset() Should not be called directly.
     *  `protected` is for testing, not for the child class.
     *  should use `emit('reset', 'reason')` instead.
     *
     * Huan(202008): Update from protected to private
     */
    reset(reason) {
        config_1.log.verbose('Puppet', 'reset(%s)', reason);
        /**
         * Huan(202003):
         *  do not care state.off()
         *  reset will cause the puppet to start (?)
         */
        // if (this.state.off()) {
        //   log.verbose('Puppet', 'reset(%s) state is off(), make the watchdog to sleep', reason)
        //   this.watchdog.sleep()
        //   return
        // }
        Promise.resolve()
            .then(() => this.stop())
            .then(() => this.start())
            .catch(e => {
            config_1.log.warn('Puppet', 'reset() exception: %s', e);
            this.emit('error', e);
        });
    }
    /**
     *
     *
     * Login / Logout
     *
     *
     */
    /**
     * Need to be called internaly when the puppet is logined.
     * this method will emit a `login` event
     */
    login(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'login(%s)', userId);
            if (this.id) {
                throw new Error('must logout first before login again!');
            }
            this.id = userId;
            // console.log('this.id=', this.id)
            const payload = {
                contactId: userId,
            };
            this.emit('login', payload);
        });
    }
    /**
     * Need to be called internaly/externaly when the puppet need to be logouted
     * this method will emit a `logout` event,
     *
     * Note: must set `this.id = undefined` in this function.
     */
    logout(reason = 'logout()') {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'logout(%s)', this.id);
            if (!this.id) {
                throw new Error('must login first before logout!');
            }
            this.emit('logout', {
                contactId: this.id,
                data: reason,
            });
            this.id = undefined;
        });
    }
    selfId() {
        config_1.log.verbose('Puppet', 'selfId()');
        if (!this.id) {
            throw new Error('not logged in, no this.id yet.');
        }
        return this.id;
    }
    logonoff() {
        if (this.id) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Get the NPM name of the Puppet
     */
    name() {
        return this.childPkg.name;
    }
    /**
     * Get version from the Puppet Implementation
     */
    version() {
        return this.childPkg.version;
    }
    /**
     * will be used by semver.satisfied(version, range)
     */
    wechatyVersionRange(strict = false) {
        // FIXME: for development, we use `*` if not set
        if (strict) {
            return '^0.16.0';
        }
        return '*';
        // TODO: test and uncomment the following codes after promote the `wehcaty-puppet` as a solo NPM module
        // if (this.pkg.dependencies && this.pkg.dependencies.wechaty) {
        //   throw new Error('Wechaty Puppet Implementation should add `wechaty` from `dependencies` to `peerDependencies` in package.json')
        // }
        // if (!this.pkg.peerDependencies || !this.pkg.peerDependencies.wechaty) {
        //   throw new Error('Wechaty Puppet Implementation should add `wechaty` to `peerDependencies`')
        // }
        // if (!this.pkg.engines || !this.pkg.engines.wechaty) {
        //   throw new Error('Wechaty Puppet Implementation must define `package.engines.wechaty` for a required Version Range')
        // }
        // return this.pkg.engines.wechaty
    }
    contactRoomList(contactId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'contactRoomList(%s)', contactId);
            const roomIdList = yield this.roomList();
            const roomPayloadList = yield Promise.all(roomIdList.map(roomId => this.roomPayload(roomId)));
            const resultRoomIdList = roomPayloadList
                .filter(roomPayload => roomPayload.memberIdList.includes(contactId))
                .map(payload => payload.id);
            return resultRoomIdList;
        });
    }
    contactSearch(query, searchIdList) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'contactSearch(query=%s, %s)', JSON.stringify(query), searchIdList
                ? `idList.length = ${searchIdList.length}`
                : '');
            if (!searchIdList) {
                searchIdList = yield this.contactList();
            }
            config_1.log.silly('Puppet', 'contactSearch() searchIdList.length = %d', searchIdList.length);
            if (!query) {
                return searchIdList;
            }
            if (typeof query === 'string') {
                const nameIdList = yield this.contactSearch({ name: query }, searchIdList);
                const aliasIdList = yield this.contactSearch({ alias: query }, searchIdList);
                return Array.from(new Set([
                    ...nameIdList,
                    ...aliasIdList,
                ]));
            }
            const filterFuncion = this.contactQueryFilterFactory(query);
            const BATCH_SIZE = 16;
            let batchIndex = 0;
            const resultIdList = [];
            const matchId = (id) => __awaiter(this, void 0, void 0, function* () {
                try {
                    /**
                     * Does LRU cache matter at here?
                     */
                    // const rawPayload = await this.contactRawPayload(id)
                    // const payload    = await this.contactRawPayloadParser(rawPayload)
                    const payload = yield this.contactPayload(id);
                    if (filterFuncion(payload)) {
                        return id;
                    }
                }
                catch (e) {
                    config_1.log.silly('Puppet', 'contactSearch() contactPayload exception: %s', e.message);
                    yield this.dirtyPayloadContact(id);
                }
                return undefined;
            });
            while (BATCH_SIZE * batchIndex < searchIdList.length) {
                const batchSearchIdList = searchIdList.slice(BATCH_SIZE * batchIndex, BATCH_SIZE * (batchIndex + 1));
                const matchBatchIdFutureList = batchSearchIdList.map(matchId);
                const matchBatchIdList = yield Promise.all(matchBatchIdFutureList);
                const batchSearchIdResultList = matchBatchIdList.filter(id => !!id);
                resultIdList.push(...batchSearchIdResultList);
                batchIndex++;
            }
            config_1.log.silly('Puppet', 'contactSearch() searchContactPayloadList.length = %d', resultIdList.length);
            return resultIdList;
        });
    }
    contactQueryFilterFactory(query) {
        config_1.log.verbose('Puppet', 'contactQueryFilterFactory(%s)', JSON.stringify(query));
        /**
         * Clean the query for keys with empty value
         */
        Object.keys(query).forEach(key => {
            if (query[key] === undefined) {
                delete query[key];
            }
        });
        if (Object.keys(query).length < 1) {
            throw new Error('query must provide at least one key. current query is empty.');
        }
        else if (Object.keys(query).length > 1) {
            throw new Error('query only support one key. multi key support is not availble now.');
        }
        const filterKey = Object.keys(query)[0].toLowerCase();
        const isValid = [
            'alias',
            'id',
            'name',
            'weixin',
        ].includes(filterKey);
        if (!isValid) {
            throw new Error('key not supported: ' + filterKey);
        }
        // TypeScript bug: have to set `undefined | string | RegExp` at here, or the later code type check will get error
        const filterValue = query[filterKey];
        if (!filterValue) {
            throw new Error('filterValue not found for filterKey: ' + filterKey);
        }
        let filterFunction;
        if (typeof filterValue === 'string') {
            filterFunction = (payload) => filterValue === payload[filterKey];
        }
        else if (filterValue instanceof RegExp) {
            filterFunction = (payload) => !!payload[filterKey] && filterValue.test(payload[filterKey]);
        }
        else {
            throw new Error('unsupport filterValue type: ' + typeof filterValue);
        }
        return filterFunction;
    }
    /**
     * Check a Contact Id if it's still valid.
     *  For example: talk to the server, and see if it should be deleted in the local cache.
     */
    contactValidate(contactId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.silly('Puppet', 'contactValidate(%s) base class just return `true`', contactId);
            return true;
        });
    }
    contactPayloadCache(contactId) {
        // log.silly('Puppet', 'contactPayloadCache(id=%s) @ %s', contactId, this)
        if (!contactId) {
            throw new Error('no id');
        }
        const cachedPayload = this.cacheContactPayload.get(contactId);
        if (cachedPayload) {
            // log.silly('Puppet', 'contactPayload(%s) cache HIT', contactId)
        }
        else {
            config_1.log.silly('Puppet', 'contactPayload(%s) cache MISS', contactId);
        }
        return cachedPayload;
    }
    contactPayload(contactId) {
        return __awaiter(this, void 0, void 0, function* () {
            // log.silly('Puppet', 'contactPayload(id=%s) @ %s', contactId, this)
            if (!contactId) {
                throw new Error('no id');
            }
            /**
             * 1. Try to get from cache first
             */
            const cachedPayload = this.contactPayloadCache(contactId);
            if (cachedPayload) {
                return cachedPayload;
            }
            /**
             * 2. Cache not found
             */
            const rawPayload = yield this.contactRawPayload(contactId);
            const payload = yield this.contactRawPayloadParser(rawPayload);
            this.cacheContactPayload.set(contactId, payload);
            config_1.log.silly('Puppet', 'contactPayload(%s) cache SET', contactId);
            return payload;
        });
    }
    friendshipSearch(searchQueryFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'friendshipSearch("%s")', JSON.stringify(searchQueryFilter));
            if (Object.keys(searchQueryFilter).length !== 1) {
                throw new Error('searchQueryFilter should only include one key for query!');
            }
            if (searchQueryFilter.phone) {
                return this.friendshipSearchPhone(searchQueryFilter.phone);
            }
            else if (searchQueryFilter.weixin) {
                return this.friendshipSearchWeixin(searchQueryFilter.weixin);
            }
            throw new Error(`unknown key from searchQueryFilter: ${Object.keys(searchQueryFilter).join('')}`);
        });
    }
    friendshipPayloadCache(friendshipId) {
        config_1.log.silly('Puppet', 'friendshipPayloadCache(id=%s) @ %s', friendshipId, this);
        if (!friendshipId) {
            throw new Error('no id');
        }
        const cachedPayload = this.cacheFriendshipPayload.get(friendshipId);
        if (cachedPayload) {
            // log.silly('Puppet', 'friendshipPayloadCache(%s) cache HIT', friendshipId)
        }
        else {
            config_1.log.silly('Puppet', 'friendshipPayloadCache(%s) cache MISS', friendshipId);
        }
        return cachedPayload;
    }
    friendshipPayload(friendshipId, newPayload) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'friendshipPayload(%s)', friendshipId, newPayload
                ? ',' + JSON.stringify(newPayload)
                : '');
            if (typeof newPayload === 'object') {
                yield this.cacheFriendshipPayload.set(friendshipId, newPayload);
                return;
            }
            /**
             * 1. Try to get from cache first
             */
            const cachedPayload = this.friendshipPayloadCache(friendshipId);
            if (cachedPayload) {
                return cachedPayload;
            }
            /**
             * 2. Cache not found
             */
            const rawPayload = yield this.friendshipRawPayload(friendshipId);
            const payload = yield this.friendshipRawPayloadParser(rawPayload);
            this.cacheFriendshipPayload.set(friendshipId, payload);
            return payload;
        });
    }
    messagePayloadCache(messageId) {
        // log.silly('Puppet', 'messagePayloadCache(id=%s) @ %s', messageId, this)
        if (!messageId) {
            throw new Error('no id');
        }
        const cachedPayload = this.cacheMessagePayload.get(messageId);
        if (cachedPayload) {
            // log.silly('Puppet', 'messagePayloadCache(%s) cache HIT', messageId)
        }
        else {
            config_1.log.silly('Puppet', 'messagePayloadCache(%s) cache MISS', messageId);
        }
        return cachedPayload;
    }
    messagePayload(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'messagePayload(%s)', messageId);
            if (!messageId) {
                throw new Error('no id');
            }
            /**
             * 1. Try to get from cache first
             */
            const cachedPayload = this.messagePayloadCache(messageId);
            if (cachedPayload) {
                return cachedPayload;
            }
            /**
             * 2. Cache not found
             */
            const rawPayload = yield this.messageRawPayload(messageId);
            const payload = yield this.messageRawPayloadParser(rawPayload);
            this.cacheMessagePayload.set(messageId, payload);
            config_1.log.silly('Puppet', 'messagePayload(%s) cache SET', messageId);
            return payload;
        });
    }
    messageList() {
        config_1.log.verbose('Puppet', 'messageList()');
        return [...this.cacheMessagePayload.keys()];
    }
    messageSearch(query) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'messageSearch(%s)', JSON.stringify(query));
            const allMessageIdList = this.messageList();
            config_1.log.silly('Puppet', 'messageSearch() allMessageIdList.length=%d', allMessageIdList.length);
            if (!query || Object.keys(query).length <= 0) {
                return allMessageIdList;
            }
            const messagePayloadList = yield Promise.all(allMessageIdList.map(id => this.messagePayload(id)));
            const filterFunction = this.messageQueryFilterFactory(query);
            const messageIdList = messagePayloadList
                .filter(filterFunction)
                .map(payload => payload.id);
            config_1.log.silly('Puppet', 'messageSearch() messageIdList filtered. result length=%d', messageIdList.length);
            return messageIdList;
        });
    }
    messageQueryFilterFactory(query) {
        config_1.log.verbose('Puppet', 'messageQueryFilterFactory(%s)', JSON.stringify(query));
        if (Object.keys(query).length < 1) {
            throw new Error('query empty');
        }
        const filterFunctionList = [];
        const filterKeyList = Object.keys(query);
        for (const filterKey of filterKeyList) {
            // TypeScript bug: have to set `undefined | string | RegExp` at here, or the later code type check will get error
            const filterValue = query[filterKey];
            if (!filterValue) {
                throw new Error('filterValue not found for filterKey: ' + filterKey);
            }
            let filterFunction;
            if (filterValue instanceof RegExp) {
                filterFunction = (payload) => filterValue.test(payload[filterKey]);
            }
            else { // if (typeof filterValue === 'string') {
                filterFunction = (payload) => filterValue === payload[filterKey];
            }
            filterFunctionList.push(filterFunction);
        }
        const allFilterFunction = payload => filterFunctionList.every(func => func(payload));
        return allFilterFunction;
    }
    messageForward(conversationId, messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'messageForward(%s, %s)', JSON.stringify(conversationId), messageId);
            const payload = yield this.messagePayload(messageId);
            let newMsgId;
            switch (payload.type) {
                case message_1.MessageType.Attachment: // Attach(6),
                case message_1.MessageType.Audio: // Audio(1), Voice(34)
                case message_1.MessageType.Image: // Img(2), Image(3)
                case message_1.MessageType.Video: // Video(4), Video(43)
                    newMsgId = yield this.messageSendFile(conversationId, yield this.messageFile(messageId));
                    break;
                case message_1.MessageType.Text: // Text(1)
                    if (payload.text) {
                        newMsgId = yield this.messageSendText(conversationId, payload.text);
                    }
                    else {
                        config_1.log.warn('Puppet', 'messageForward() payload.text is undefined.');
                    }
                    break;
                case message_1.MessageType.MiniProgram: // MiniProgram(33)
                    newMsgId = yield this.messageSendMiniProgram(conversationId, yield this.messageMiniProgram(messageId));
                    break;
                case message_1.MessageType.Url: // Url(5)
                    yield this.messageSendUrl(conversationId, yield this.messageUrl(messageId));
                    break;
                case message_1.MessageType.Contact: // ShareCard(42)
                    newMsgId = yield this.messageSendContact(conversationId, yield this.messageContact(messageId));
                    break;
                case message_1.MessageType.ChatHistory: // ChatHistory(19)
                case message_1.MessageType.Location: // Location(48)
                case message_1.MessageType.Emoticon: // Sticker: Emoticon(15), Emoticon(47)
                case message_1.MessageType.Transfer:
                case message_1.MessageType.RedEnvelope:
                case message_1.MessageType.Recalled: // Recalled(10002)
                    throw_unsupported_error_1.throwUnsupportedError();
                    break;
                case message_1.MessageType.Unknown:
                default:
                    throw new Error('Unsupported forward message type:' + message_1.MessageType[payload.type]);
            }
            if (newMsgId) {
                return newMsgId;
            }
        });
    }
    /**
     *
     * Room Invitation
     *
     */
    roomInvitationPayloadCache(roomInvitationId) {
        // log.silly('Puppet', 'roomInvitationPayloadCache(id=%s) @ %s', friendshipId, this)
        if (!roomInvitationId) {
            throw new Error('no id');
        }
        const cachedPayload = this.cacheRoomInvitationPayload.get(roomInvitationId);
        if (cachedPayload) {
            // log.silly('Puppet', 'roomInvitationPayloadCache(%s) cache HIT', roomInvitationId)
        }
        else {
            config_1.log.silly('Puppet', 'roomInvitationPayloadCache(%s) cache MISS', roomInvitationId);
        }
        return cachedPayload;
    }
    roomInvitationPayload(roomInvitationId, newPayload) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'roomInvitationPayload(%s)', roomInvitationId);
            if (typeof newPayload === 'object') {
                this.cacheRoomInvitationPayload.set(roomInvitationId, newPayload);
                return;
            }
            /**
             * 1. Try to get from cache first
             */
            const cachedPayload = this.roomInvitationPayloadCache(roomInvitationId);
            if (cachedPayload) {
                return cachedPayload;
            }
            /**
             * 2. Cache not found
             */
            const rawPayload = yield this.roomInvitationRawPayload(roomInvitationId);
            const payload = yield this.roomInvitationRawPayloadParser(rawPayload);
            return payload;
        });
    }
    roomMemberSearch(roomId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'roomMemberSearch(%s, %s)', roomId, JSON.stringify(query));
            if (!this.id) {
                throw new Error('no puppet.id. need puppet to be login-ed for a search');
            }
            if (!query) {
                throw new Error('no query');
            }
            /**
             * 0. for YOU: 'You', '你' in sys message
             */
            if (query === puppet_1.YOU) {
                return [this.id];
            }
            /**
             * 1. for Text Query
             */
            if (typeof query === 'string') {
                let contactIdList = [];
                contactIdList = contactIdList.concat(yield this.roomMemberSearch(roomId, { roomAlias: query }), yield this.roomMemberSearch(roomId, { name: query }), yield this.roomMemberSearch(roomId, { contactAlias: query }));
                // Keep the unique id only
                // https://stackoverflow.com/a/14438954/1123955
                // return [...new Set(contactIdList)]
                return Array.from(new Set(contactIdList));
            }
            /**
             * 2. for RoomMemberQueryFilter
             */
            const memberIdList = yield this.roomMemberList(roomId);
            let idList = [];
            if (query.contactAlias || query.name) {
                /**
                 * We will only have `alias` or `name` set at here.
                 * One is set, the other will be `undefined`
                 */
                const contactQueryFilter = {
                    alias: query.contactAlias,
                    name: query.name,
                };
                idList = idList.concat(yield this.contactSearch(contactQueryFilter, memberIdList));
            }
            const memberPayloadList = yield Promise.all(memberIdList.map(contactId => this.roomMemberPayload(roomId, contactId)));
            if (query.roomAlias) {
                idList = idList.concat(memberPayloadList.filter(payload => payload.roomAlias === query.roomAlias).map(payload => payload.id));
            }
            return idList;
        });
    }
    roomSearch(query) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'roomSearch(%s)', query ? JSON.stringify(query) : '');
            const allRoomIdList = yield this.roomList();
            config_1.log.silly('Puppet', 'roomSearch() allRoomIdList.length=%d', allRoomIdList.length);
            if (!query || Object.keys(query).length <= 0) {
                return allRoomIdList;
            }
            const roomPayloadList = [];
            const BATCH_SIZE = 10;
            let batchIndex = 0;
            while (batchIndex * BATCH_SIZE < allRoomIdList.length) {
                const batchRoomIds = allRoomIdList.slice(BATCH_SIZE * batchIndex, BATCH_SIZE * (batchIndex + 1));
                const batchPayloads = (yield Promise.all(batchRoomIds.map((id) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        return yield this.roomPayload(id);
                    }
                    catch (e) {
                        // compatible with {} payload
                        config_1.log.silly('Puppet', 'roomSearch() roomPayload exception: %s', e.message);
                        // Remove invalid room id from cache to avoid getting invalid room payload again
                        yield this.dirtyPayloadRoom(id);
                        yield this.dirtyPayloadRoomMember(id);
                        return {};
                    }
                })))).filter(payload => Object.keys(payload).length > 0);
                roomPayloadList.push(...batchPayloads);
                batchIndex++;
            }
            const filterFunction = this.roomQueryFilterFactory(query);
            const roomIdList = roomPayloadList
                .filter(filterFunction)
                .map(payload => payload.id);
            config_1.log.silly('Puppet', 'roomSearch() roomIdList filtered. result length=%d', roomIdList.length);
            return roomIdList;
        });
    }
    roomQueryFilterFactory(query) {
        config_1.log.verbose('Puppet', 'roomQueryFilterFactory(%s)', JSON.stringify(query));
        if (Object.keys(query).length < 1) {
            throw new Error('query must provide at least one key. current query is empty.');
        }
        else if (Object.keys(query).length > 1) {
            throw new Error('query only support one key. multi key support is not availble now.');
        }
        // TypeScript bug: have to set `undefined | string | RegExp` at here, or the later code type check will get error
        const filterKey = Object.keys(query)[0].toLowerCase();
        const isValid = [
            'topic',
            'id',
        ].includes(filterKey);
        if (!isValid) {
            throw new Error('query key unknown: ' + filterKey);
        }
        const filterValue = query[filterKey];
        if (!filterValue) {
            throw new Error('filterValue not found for filterKey: ' + filterKey);
        }
        let filterFunction;
        if (filterValue instanceof RegExp) {
            filterFunction = (payload) => filterValue.test(payload[filterKey]);
        }
        else { // if (typeof filterValue === 'string') {
            filterFunction = (payload) => filterValue === payload[filterKey];
        }
        return filterFunction;
    }
    /**
     * Check a Room Id if it's still valid.
     *  For example: talk to the server, and see if it should be deleted in the local cache.
     */
    roomValidate(roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.silly('Puppet', 'roomValidate(%s) base class just return `true`', roomId);
            return true;
        });
    }
    roomPayloadCache(roomId) {
        // log.silly('Puppet', 'roomPayloadCache(id=%s) @ %s', roomId, this)
        if (!roomId) {
            throw new Error('no id');
        }
        const cachedPayload = this.cacheRoomPayload.get(roomId);
        if (cachedPayload) {
            // log.silly('Puppet', 'roomPayloadCache(%s) cache HIT', roomId)
        }
        else {
            config_1.log.silly('Puppet', 'roomPayloadCache(%s) cache MISS', roomId);
        }
        return cachedPayload;
    }
    roomPayload(roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'roomPayload(%s)', roomId);
            if (!roomId) {
                throw new Error('no id');
            }
            /**
             * 1. Try to get from cache first
             */
            const cachedPayload = this.roomPayloadCache(roomId);
            if (cachedPayload) {
                return cachedPayload;
            }
            /**
             * 2. Cache not found
             */
            const rawPayload = yield this.roomRawPayload(roomId);
            const payload = yield this.roomRawPayloadParser(rawPayload);
            this.cacheRoomPayload.set(roomId, payload);
            config_1.log.silly('Puppet', 'roomPayload(%s) cache SET', roomId);
            return payload;
        });
    }
    /**
     * Concat roomId & contactId to one string
     */
    cacheKeyRoomMember(roomId, contactId) {
        return contactId + '@@@' + roomId;
    }
    roomMemberPayload(roomId, memberId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'roomMemberPayload(roomId=%s, memberId=%s)', roomId, memberId);
            if (!roomId || !memberId) {
                throw new Error('no id');
            }
            /**
             * 1. Try to get from cache
             */
            const CACHE_KEY = this.cacheKeyRoomMember(roomId, memberId);
            const cachedPayload = this.cacheRoomMemberPayload.get(CACHE_KEY);
            if (cachedPayload) {
                return cachedPayload;
            }
            /**
             * 2. Cache not found
             */
            const rawPayload = yield this.roomMemberRawPayload(roomId, memberId);
            if (!rawPayload) {
                throw new Error('contact(' + memberId + ') is not in the Room(' + roomId + ')');
            }
            const payload = yield this.roomMemberRawPayloadParser(rawPayload);
            this.cacheRoomMemberPayload.set(CACHE_KEY, payload);
            config_1.log.silly('Puppet', 'roomMemberPayload(%s) cache SET', roomId);
            return payload;
        });
    }
    /**
     *
     * dirty payload methods
     *  See: https://github.com/Chatie/grpc/pull/79
     *
     */
    dirtyPayload(type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'dirtyPayload(%s<%s>, %s)', payload_1.PayloadType[type], type, id);
            switch (type) {
                case payload_1.PayloadType.Message:
                    return this.dirtyPayloadMessage(id);
                case payload_1.PayloadType.Contact:
                    return this.dirtyPayloadContact(id);
                case payload_1.PayloadType.Room:
                    return this.dirtyPayloadRoom(id);
                case payload_1.PayloadType.RoomMember:
                    return this.dirtyPayloadRoomMember(id);
                case payload_1.PayloadType.Friendship:
                    return this.dirtyPayloadFriendship(id);
                default:
                    throw new Error('unknown payload type: ' + type);
            }
        });
    }
    dirtyPayloadRoom(roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'dirtyPayloadRoom(%s)', roomId);
            this.cacheRoomPayload.delete(roomId);
        });
    }
    dirtyPayloadContact(contactId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'dirtyPayloadContact(%s)', contactId);
            this.cacheContactPayload.delete(contactId);
        });
    }
    dirtyPayloadFriendship(friendshipId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'dirtyPayloadFriendship(%s)', friendshipId);
            this.cacheFriendshipPayload.delete(friendshipId);
        });
    }
    dirtyPayloadMessage(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'dirtyPayloadMessage(%s)', messageId);
            this.cacheMessagePayload.delete(messageId);
        });
    }
    dirtyPayloadRoomMember(roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.log.verbose('Puppet', 'dirtyPayloadRoomMember(%s)', roomId);
            const contactIdList = yield this.roomMemberList(roomId);
            let cacheKey;
            contactIdList.forEach(contactId => {
                cacheKey = this.cacheKeyRoomMember(roomId, contactId);
                this.cacheRoomMemberPayload.delete(cacheKey);
            });
        });
    }
}
exports.Puppet = Puppet;
/**
 * Must overwrite by child class to identify their version
 */
Puppet.VERSION = '0.0.0';
exports.default = Puppet;
//# sourceMappingURL=puppet.js.map