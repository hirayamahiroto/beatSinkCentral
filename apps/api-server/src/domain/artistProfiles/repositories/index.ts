import type {
  ArtistProfile,
  ArtistProfilePersistenceData,
} from "../entities";
import type { TransactionContext } from "../../../infrastructure/transaction";

export type ArtistProfileSaveData = ArtistProfilePersistenceData;

export type ArtistProfileSetPublishedData = {
  artistId: string;
  published: boolean;
};

export interface IArtistProfileRepository {
  // 編集用・公開判定用（下書きを含む全フィールドを返す）。本人のみが利用する。
  findByArtistId(
    artistId: string,
    tx?: TransactionContext,
  ): Promise<ArtistProfile | null>;

  // 公開詳細用。accountId（ハンドル）で引き、published のもののみ返す。
  findPublishedByAccountId(accountId: string): Promise<ArtistProfile | null>;

  // 作成・更新（artistId 単位の upsert）。多値（ジャンル / SNS）も差し替える。
  upsert(
    data: ArtistProfileSaveData,
    tx?: TransactionContext,
  ): Promise<ArtistProfile>;

  // 公開フラグの切り替え（公開可否の判定は呼び出し元の責務）。
  setPublished(
    data: ArtistProfileSetPublishedData,
    tx?: TransactionContext,
  ): Promise<ArtistProfile>;
}
