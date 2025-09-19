# Hater AI - In-App Purchase Products Reference

This document contains all the In-App Purchase products for Hater AI, organized by category with the required information for App Store Connect configuration.

## 📋 Product Categories Overview

### Types of IAP:
- **Consumable**: Items that are depleted as they're used and can be purchased again (e.g., chat packs)
- **Non-Consumable**: Items purchased once that don't expire (e.g., personality packs, premium features)
- **Subscription**: Recurring payments for ongoing access (e.g., premium features)

---

## 🎭 Personality Packs (Non-Consumable)

| Type | Reference Name | Product ID | Display Name | Price |
|------|----------------|------------|--------------|--------|
| Non-Consumable | Cultural Regional Pack | `pack_cultural_regional` | Cultural & Regional Characters | $7.99 |
| Non-Consumable | Professional Expert Pack | `pack_professional_expert` | Professional & Expert Characters | $7.99 |
| Non-Consumable | Pop Culture Pack | `pack_pop_culture` | Pop Culture Characters | $7.99 |

**Description**: Unlock themed collections of AI personalities with unique roasting styles and cultural backgrounds.

### **Pack Contents:**

#### **🌍 Cultural/Regional Pack** (`pack_cultural_regional`)
- The Posh New Yorker
- British Gentleman
- Southern Belle
- Valley Girl
- Surfer Dude
- Bronx Bambino

#### **💼 Professional/Expert Pack** (`pack_professional_expert`)
- Grammar Police
- Fitness Coach
- Chef Gordon
- Detective
- Therapist

#### **📱 Pop Culture Pack** (`pack_pop_culture`)
- Mean Girl
- TikTok Influencer
- Boomer
- Hipster
- Karen

---

## 👤 Individual Personalities (Non-Consumable)

| Type          | Reference Name | Product ID | Display Name | Price |
|------|----------------|------------|--------------|--------|
<!-- | **🌍 Cultural/Regional Pack** | | | | |
| Non-Consumable | British Gentleman | `personality_british_gentleman` | British Gentleman | $1.99 |
| Non-Consumable | Southern Belle | `personality_southern_belle` | Southern Belle | $1.99 |
| Non-Consumable | Valley Girl | `personality_valley_girl` | Valley Girl | $1.99 |
| Non-Consumable | Surfer Dude | `personality_surfer_dude` | Surfer Dude | $1.99 |
| Non-Consumable | Bronx Bambino | `personality_bronx_bambino` | The Bronx Bambino | $1.99 | -->
<!-- | **💼 Professional/Expert Pack** | | | | |
| Non-Consumable | Grammar Police | `personality_grammar_police` | Grammar Police | $1.99 |
| Non-Consumable | Fitness Coach | `personality_fitness_coach` | Fitness Coach | $1.99 |
| Non-Consumable | Chef Gordon | `personality_chef_gordon` | Chef Gordon | $1.99 |
| Non-Consumable | Detective | `personality_detective` | Detective | $1.99 |
| Non-Consumable | Therapist | `personality_therapist` | Therapist | $1.99 | -->
<!-- | **📱 Pop Culture Pack** | | | | |
| Non-Consumable | Mean Girl | `personality_mean_girl` | Mean Girl | $1.99 |
| Non-Consumable | TikTok Influencer | `personality_tiktok_influencer` | TikTok Influencer | $1.99 |
| Non-Consumable | Boomer | `personality_boomer` | Boomer | $1.99 | -->
| Non-Consumable | Hipster | `personality_hipster` | Hipster | $1.99 |
| Non-Consumable | Karen | `personality_karen` | Karen | $1.99 |

**Description**: Unlock individual AI personalities with unique voices, attitudes, and roasting styles. Each personality belongs to a themed pack but can be purchased individually.

---

## 🔥 Premium Features (Non-Consumable)

| Type | Reference Name | Product ID | Display Name | Price |
|------|----------------|------------|--------------|--------|
| Non-Consumable | Allow Cursing Feature | `allow_cursing` | Unleash the Beast | $2.99 |

**Description**: Unlock premium features that enhance your AI roasting experience.

---

## 💬 Chat Packs (Consumable)

| Type | Reference Name | Product ID | Display Name | Price |
|------|----------------|------------|--------------|--------|
| Consumable | 20 Chat Pack | `chat_pack_20` | 20 Chat Pack | $3.99 |
| Consumable | 50 Chat Pack | `chat_pack_50` | 50 Chat Pack | $6.99 |

**Description**: Purchase additional chat credits to continue your conversations beyond the free daily limit.

---

## ⭐ Subscription Plans (Subscription)

| Type | Reference Name | Product ID | Display Name | Price |
|------|----------------|------------|--------------|--------|
| Subscription | Basic Monthly | `subscription_basic_monthly` | Basic Monthly | $4.99/month |
| Subscription | Pro Monthly | `subscription_pro_monthly` | Pro Monthly | $9.99/month |
| Subscription | Pro Yearly | `subscription_pro_yearly` | Pro Yearly | $99.99/year |
| Subscription | Lifetime Access | `subscription_lifetime` | Lifetime Access | $199.99 |

**Description**: Subscribe for unlimited access to all features and premium content.

---

## 📋 App Store Connect Setup Instructions

### Step 1: Create Products
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Navigate to **Features** → **In-App Purchases**
4. Click **"+"** to create each product

### Step 2: Configure Each Product
For each product, set:

- **Product Type**: As specified in the table above
- **Reference Name**: Use the name from the table (max 64 characters)
- **Product ID**: Use the exact ID from the table
- **Price**: Set the suggested price tier
- **Display Name**: User-friendly name for the App Store
- **Description**: Detailed description of what the user gets

### Step 3: Product Information
- **Review Screenshot**: Upload a screenshot showing the IAP in your app
- **Review Notes**: Explain how the IAP works and what users receive

### Step 4: Availability
- Set **"Cleared for Sale"** to **Yes**
- Configure availability by country/region as needed

---

## ⚠️ Important Notes

### Product ID Rules:
- **Unique**: Once used, cannot be reused even if product is deleted
- **Format**: Use lowercase with underscores (no spaces)
- **Prefix**: Use descriptive prefixes (pack_, personality_, chat_pack_, subscription_)
- **Consistency**: Must match exactly between code and App Store Connect

### Reference Name Guidelines:
- **Purpose**: Internal use only (not visible to users)
- **Length**: Maximum 64 characters
- **Clarity**: Should be descriptive for your records
- **Reports**: Appears in Sales and Trends reports

### Type Selection:
- **Consumable**: For items that get used up (chat packs)
- **Non-Consumable**: For permanent unlocks (personalities, features)
- **Subscription**: For recurring access (unlimited features)

---

## 📊 Pricing Strategy

### Current Pricing Structure:
- **Free Tier**: 7 chats per day
- **Entry Level**: $1.99-$3.99 (individual items)
- **Mid Tier**: $6.99-$9.99 (packs and features)
- **Premium**: $199.99 (lifetime access)
- **Subscription**: $4.99-$9.99/month

### Value Proposition:
- **Affordable Entry**: Low-cost individual personalities
- **Bundle Savings**: Pack discounts encourage larger purchases
- **Subscription Value**: Monthly plans for heavy users
- **Lifetime Option**: One-time purchase for dedicated users

---

## 🎯 Launch Checklist

- [ ] All Product IDs configured in App Store Connect
- [ ] Reference names set correctly
- [ ] Product types configured properly
- [ ] Pricing tiers set appropriately
- [ ] Review screenshots uploaded
- [ ] Product descriptions written
- [ ] Availability set to "Ready to Submit"
- [ ] Test IAP flow in sandbox environment

---

## 📞 Support

For questions about IAP configuration:
- Check Apple's [In-App Purchase Programming Guide](https://developer.apple.com/in-app-purchase/)
- Review the IAP_SETUP_GUIDE.md in your project
- Test purchases in the sandbox environment first

---

*Last updated: September 2025*
*Total Products: 22 IAP items across 5 categories*
