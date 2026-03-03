import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

// TODO: Replace with your RevenueCat API keys from the RevenueCat dashboard
const REVENUECAT_IOS_KEY = 'TODO: REVENUECAT_IOS_KEY';
const REVENUECAT_ANDROID_KEY = 'TODO: REVENUECAT_ANDROID_KEY';

export function initRevenueCat(uid: string) {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  Purchases.configure({ apiKey, appUserID: uid });
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (err) {
    console.error('[RevenueCat] checkSubscriptionStatus error:', err);
    return false;
  }
}

export async function getOfferings(): Promise<PurchasesPackage | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.monthly ?? offerings.current?.availablePackages[0] ?? null;
  } catch (err) {
    console.error('[RevenueCat] getOfferings error:', err);
    return null;
  }
}

export async function purchasePremium(): Promise<boolean> {
  try {
    const pkg = await getOfferings();
    if (!pkg) throw new Error('No offerings available');
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (err: any) {
    if (!err.userCancelled) {
      console.error('[RevenueCat] purchasePremium error:', err);
    }
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (err) {
    console.error('[RevenueCat] restorePurchases error:', err);
    return false;
  }
}
