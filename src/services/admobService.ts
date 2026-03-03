import React from 'react';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// TODO: Replace with real ad unit IDs before production
const AD_UNIT_ID = Platform.select({
  ios: TestIds.BANNER,
  android: TestIds.BANNER,
  default: TestIds.BANNER,
});

export function BannerAdComponent() {
  return React.createElement(BannerAd, {
    unitId: AD_UNIT_ID,
    size: BannerAdSize.FULL_BANNER,
    requestOptions: { requestNonPersonalizedAdsOnly: true },
  });
}
