export enum FriendshipType {
  Unknown = 0,
  Confirm,
  Receive,
  Verify,
}

/**
 * Huan(202002): Does those numbers are the underlying Wechat Protocol Data Values?
 */
export enum FriendshipSceneType {
  Unknown  = 0,   // Huan(202003) added by myself
  QQ       = 1,    // FIXME: Huan(202002) in Wechat PC, QQ = 12.
  Email    = 2,
  Weixin   = 3,
  QQtbd    = 12,   // FIXME: confirm the two QQ number QQ号搜索
  Room     = 14,
  Phone    = 15,
  Card     = 17,   // 名片分享
  Location = 18,
  Bottle   = 25,
  Shaking  = 29,
  QRCode   = 30,
}

/**
 * Issue #2120: https://github.com/wechaty/wechaty/pull/2120
 * Ref Issue #1801: https://github.com/wechaty/wechaty/issues/1801
 * Author: github@suhli
 *
 * sourceContactId: contact id of who send the contact card
 * sourceName: name of who send the contact card
 * shareCardContactId: maybe always empty string
 * shareCardName: maybe always empty string
 *
 * Example: https://github.com/wechaty/wechaty/issues/1801#issuecomment-761726700
 */
export interface FriendshipSource{
  sourceContactId ?:string;
  sourceName ?:string;
  shareCardContactId?:string;
  shareCardName?:string;
}

/** @hidden */
export interface FriendshipPayloadBase {
  id        : string,

  contactId : string,
  hello?    : string,
  timestamp : number, // Unix Timestamp, in seconds or milliseconds
}

/** @hidden */
export type FriendshipPayloadConfirm = FriendshipPayloadBase & {
  type      : FriendshipType.Confirm,
}

/** @hidden */
export type FriendshipPayloadReceive = FriendshipPayloadBase & {
  scene?    : FriendshipSceneType,
  stranger? : string,
  ticket    : string,
  type      : FriendshipType.Receive,
  source?   : FriendshipSource,
}

/** @hidden */
export type FriendshipPayloadVerify = FriendshipPayloadBase & {
  type      : FriendshipType.Verify,
}

export type FriendshipPayload = FriendshipPayloadConfirm
                                  | FriendshipPayloadReceive
                                  | FriendshipPayloadVerify

export interface FriendshipSearchCondition {
  phone: string,
  weixin: string,
}

// https://stackoverflow.com/a/48244432/1123955
type AtLeastOne<T, U = {[K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]

export type FriendshipSearchQueryFilter = AtLeastOne<FriendshipSearchCondition>
