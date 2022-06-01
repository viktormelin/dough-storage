currentLocation = nil
displayOpen = false

ESX = nil
Citizen.CreateThread(function()
  while ESX == nil do
    TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
      Citizen.Wait(0)
  end

  while ESX.GetPlayerData().job == nil do
    Citizen.Wait(10)
  end
end)

RegisterNetEvent('esx:playerLoaded')
AddEventHandler('esx:playerLoaded', function (xPlayer)
  ESX.PlayerData = xPlayer
end)

RegisterNetEvent('esx:setJob')
AddEventHandler('esx:setJob', function(job)
	ESX.PlayerData.job = job
end)

-- Citizen.CreateThread(function()
--   while true do
--     local sleep = 2000 
--     if ESX.PlayerData then 
--       local pos = GetEntityCoords(PlayerPedId())
--       for k, v in pairs(Config.Locations) do
--         if #(pos - v.location) < 5 then 
--           sleep = 5 
--           if #(pos - v.location) < 1.5 then 
--             DrawText3D(v.location.x, v.location.y, v.location.z, '~g~[E]~w~ access storage')
--           end

--           if IsControlJustReleased(0, 38) then 
--             currentLocation = k
--             TriggerServerEvent('doughStorage:server:openUnits', k)
--           end
--         end
--       end
--     end
--     Wait(sleep)
--   end
-- end)

Citizen.CreateThread(function()
  for k,v in pairs(Config.Locations) do 
    local blip = AddBlipForCoord(v.location)
    SetBlipSprite(blip, v.blipSprite)
    SetBlipAsShortRange(blip, true)
    SetBlipScale(blip, v.blipScale)
    SetBlipColour(blip, v.blipColour)
    BeginTextCommandSetBlipName("STRING")
    AddTextComponentString(v.label)
    EndTextCommandSetBlipName(blip)
  end
end)

RegisterNetEvent('doughStorage:client:openUnits', function(location, data, isPolice, allData)
  if location == currentLocation and not displayOpen then 
    displayOpen = true
    SetTimecycleModifier('hud_def_blur')
    SetNuiFocus(true, true)
    Citizen.Wait(500)
    SendNUIMessage({
      type = 'showUI', 
      currentlocation = location,
      unitdata = data,
      unitsettings = Config.UnitSettings,
      unitlocations = Config.Locations,
      ispolice = isPolice,
      useName = Config.UseIdentifiers,
      allunitsdata = allData,
      communityName = Config.communityName,
      communityLogo = Config.communityLogo,
      sellDecrease = Config.SellDecrease,
      locales = Config.Locales
    })
  else
    TriggerEvent('doughStorage:client:sendNotification', 'Something went wrong with this query')
  end
end)

RegisterNetEvent('doughStorage:client:closeError', function(txt)
  ESX.ShowNotification(txt)
  closeDisplay()
end)

RegisterNUICallback('hideDisplay', function()
  closeDisplay()
end)

RegisterNUICallback('buyUnit', function(data)
  if data.location == currentLocation then 
    TriggerServerEvent('doughStorage:server:buyUnit', data)
  else
    closeDisplay()
    ESX.ShowNotification('Something went wrong with this query')
  end
end)

RegisterNUICallback('sellUnit', function(data)
  ESX.TriggerServerCallback('doughStorage:server:sanityOwner', function(details) 
    if details then
      TriggerServerEvent('doughStorage:server:sellUnit', details)
    else
      closeDisplay()
      TriggerEvent('doughStorage:client:sendNotification', 'Something went wrong with this query')
    end
  end, data.id)
end)

RegisterNUICallback('openUnit', function(data)
  ESX.TriggerServerCallback('doughStorage:server:sanityOwner', function(details) 
    if details then
      TriggerEvent('doughStorage:client:openInventory', data, details)
      closeDisplay()
    else
      closeDisplay()
      TriggerEvent('doughStorage:client:sendNotification', 'Something went wrong with this query')
    end
  end, data.id)
end)

RegisterNUICallback('raidUnit', function(data)
  ESX.TriggerServerCallback('doughStorage:server:sanityPolice', function(details) 
    if details then
      TriggerEvent('doughStorage:client:raidInventory', data, details)
      closeDisplay()
    else
      closeDisplay()
      TriggerEvent('doughStorage:client:sendNotification', 'Something went wrong with this query')
    end
  end, data.id)
end)

closeDisplay = function()
  if displayOpen then
    displayOpen = false
    SetTimecycleModifier('default')
    SetNuiFocus(false, false)
    SendNUIMessage({
      type = 'hideUI', 
    })
  end
end

DrawText3D = function(x,y,z,text)
  SetTextScale(0.35, 0.35)
  SetTextFont(4)
  SetTextProportional(1)
  SetTextColour(255, 255, 255, 215)
  SetTextEntry("STRING")
  SetTextCentre(true)
  AddTextComponentString(text)
  SetDrawOrigin(x,y,z, 0)
  DrawText(0.0, 0.0)
  local factor = (string.len(text)) / 370
  DrawRect(0.0, 0.0+0.0125, 0.017+ factor, 0.03, 0, 0, 0, 75)
  ClearDrawOrigin()
end

RegisterCommand(Config.LookupCommand, function(source, args, raw)
  if #Config.AllowCommandStaff > 0 then 
    for i=1, #Config.AllowCommandStaff, 1 do 
      if ESX.PlayerData.group == Config.AllowCommandStaff[i] then 
        local closestPlayer, closestDistance = ESX.Game.GetClosestPlayer()
        if closestPlayer == -1 or closestDistance > 3.0 then 
          TriggerEvent('doughStorage:client:sendNotification', Config.Locales.noOneNear)
        else
          TriggerServerEvent('doughStorage:server:fetchUnitsFromId', closestPlayer)
        end
      end
    end
  elseif ESX.PlayerData.job.name == 'police' and ESX.PlayerData.job.grade >= Config.PoliceRaidRank then
    local closestPlayer, closestDistance = ESX.Game.GetClosestPlayer()
    if closestPlayer == -1 or closestDistance > 3.0 then 
      TriggerEvent('doughStorage:client:sendNotification', Config.Locales.noOneNear)
    else
      TriggerServerEvent('doughStorage:server:fetchUnitsFromId', closestPlayer)
    end
  end
end, false)