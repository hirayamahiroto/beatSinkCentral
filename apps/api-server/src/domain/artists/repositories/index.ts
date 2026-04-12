import type { Artist } from "../entities";

export interface IArtistRepository {
  findByUserId(userId: string): Promise<Artist | null>;
}
