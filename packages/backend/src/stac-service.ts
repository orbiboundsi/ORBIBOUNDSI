import { fetchSatelliteMetadata, type FetchOptions, type FetchResult, type StacFetcherConfig } from '@orbibound-ai/stac-fetcher';

export interface StacService { search(options: FetchOptions): Promise<FetchResult | null> }

export class DefaultStacService implements StacService {
  public constructor(private readonly config: StacFetcherConfig) {}
  public async search(options: FetchOptions): Promise<FetchResult | null> { return fetchSatelliteMetadata(options, this.config); }
}
