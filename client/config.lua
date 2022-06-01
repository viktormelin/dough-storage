AddEventHandler('doughStorage:client:openInventory', function(data, details)
  TriggerEvent('chezz-inventory:openStorageUnit', data.id, Config.Locations[details.location].label .. ' [' .. data.id .. ']', Config.UnitSettings[details.type].size)
end)

AddEventHandler('doughStorage:client:raidInventory', function(data, details)
  TriggerEvent('chezz-inventory:openStorageUnit', data.id, '| POLICE RAID |' .. Config.Locations[details.location].label .. ' [' .. data.id .. ']', Config.UnitSettings[details.type].size)
end)

RegisterNetEvent('doughStorage:client:registerStash', function(id, label, size, owner)
  -- THIS IS TRIGGERED WHEN SOMEONE BUYS / RENTS A UNIT
  -- ADD INFORMATION HERE TO REGISTER INVENTORIES IF NEEDED FOR FUNCTIONALITY WITH YOUR INVENTORY
end)


-- TriggerEvent('doughStorage:client:sendNotification', 'TEXT HERE')
-- TriggerClientEvent('doughStorage:client:sendNotification', TARGET, 'TEXT HERE')
RegisterNetEvent('doughStorage:client:sendNotification', function(text)
  ESX.ShowNotification(text)
end)

-- THREAD FOR TEXT UI
Citizen.CreateThread(function()
  while true do
    local sleep = 2000 
    if ESX.PlayerData then 
      local pos = GetEntityCoords(PlayerPedId())
      for k, v in pairs(Config.Locations) do
        if #(pos - v.location) < 5 then 
          sleep = 5 
          if #(pos - v.location) < 1.5 then 
            DrawText3D(v.location.x, v.location.y, v.location.z, '~g~[E]~w~ access storage')
          end

          if IsControlJustReleased(0, 38) then 
            currentLocation = k
            TriggerServerEvent('doughStorage:server:openUnits', k)
          end
        end
      end
    end
    Wait(sleep)
  end
end)