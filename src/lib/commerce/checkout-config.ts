export interface CommerceCheckoutShippingConfiguration {
  readonly originAddressConfigured: true;
  readonly originAddressContractVersion: 1;
}

export interface CommerceCheckoutConfiguration {
  readonly storeId?: string;
  readonly channelId?: string;
  readonly currencyCode?: string;
  readonly enablePromotionCodes: boolean;
  readonly enableTaxCollection: boolean;
  readonly enableShipping: boolean;
  readonly shipping?: CommerceCheckoutShippingConfiguration;
}

export const commerceCheckoutConfiguration: CommerceCheckoutConfiguration = {
  storeId: "ce06aef8-7a86-4f4d-9e3b-e13129645cbf",
  channelId: "ebd29211-2b00-4e00-89c8-c90c39ee5168",
  currencyCode: "USD",
  enablePromotionCodes: false,
  enableTaxCollection: false,
  enableShipping: false,
};
