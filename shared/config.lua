Config = {}
Config.Account = 'bank'
Config.RentInterval = 120 -- restart / minutes (120 = 2 hours)
Config.SellDecrease = 40 -- 40 = original price - 40%
Config.PoliceRaidRank = 1 -- lowest grade to allow raid
Config.LookupCommand = 'playerunits' -- command to find nearest persons owned units
Config.AllowCommandStaff = {'admin', 'superadmin'} -- leave empty to dissallow staff access
Config.UseIdentifiers = false -- show player name or identifier on raid menu 


-- COMMUNITY SETTINGS
Config.communityName = 'dough.land'
Config.communityLogo = 'https://imagedelivery.net/3ecvmLCFkS-FijMWb0qFvQ/1f083dde-66d2-4521-f21e-262d3b77a200/public'


-- LOCATTION SETTINGS
Config.Locations = {
  ['city1'] = {
    location = vec3(758.86, -719.73, 28.15),
    blipSprite = 478,
    blipColour = 25,
    blipScale = 0.8,
    label = 'Grove Street Storage',
    types = {
      {type = 'small', rentPrice = 1500, buyPrice = 50000},
      {type = 'medium', rentPrice = 5000, buyPrice = 50000},
    },
  },
}

Config.UnitSettings = {
  ['small'] = {
    type = 'small',
    size = 5000,
    label = 'small storage unit',
    image = 'https://dough.land/u/Bb7I6zISP5.png'
  },

  ['medium'] = {
    type = 'medium',
    size = 10000,
    label = 'medium storage unit',
    image = 'https://dough.land/u/SEoD6q00o7.png'
  },

  ['large'] = {
    type = 'large',
    size = 20000,
    label = 'large storage unit',
    image = 'https://dough.land/u/iSVP5tTLD2.png'
  },
}

Config.Locales = {
  myUnits = 'my units',
  buyUnits = 'buy units',
  raidUnits = 'raid units',
  searchInput = 'search ID',
  totalWeight = 'total weight:',
  rentPrice = 'rent price:',
  buyPrice = 'buy price:',
  sellPrice = 'sell price:',
  buyUnit = 'buy unit',
  rentUnit = 'rent unit',
  confirmationText = 'Confirmation',
  confirmOption = 'confirm',
  cancelOption = 'cancel',
  openUnit = 'open unit',
  cancelRent = 'cancel rent',
  sellUnit = 'sell unit',
  storageNumber = 'storage no.',
  ownerLabel = 'owner',
  raidUnit = 'raid unit',
  raidConfirmation = 'Confirm that you want to raid this unit! A report will be created with all details',
  cancelConfirmation = 'Confirm your cancellation request',
  purchaseConfirmation = 'Confirm your purchase',
  noOneNear = 'No one is near you',
  notEnoughMoney = 'You lack the funds for this purchase',
  youPaidRent = 'You paid rent for your storageunit',
}