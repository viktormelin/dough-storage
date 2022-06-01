ESX = nil 
TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)

RegisterNetEvent('doughStorage:server:openUnits', function(location)
  local _source = source
  local xPlayer = ESX.GetPlayerFromId(_source)
  local identifier = xPlayer.identifier

  if Config.Locations[location] then 
    MySQL.Async.fetchAll('SELECT * FROM doughStorage WHERE owner = ? AND location = ?', {
      identifier, location
    }, function(result)
      if result then 
        local exportData = {}
        local allData = {}

        for i=1, #result, 1 do 
          exportData[#exportData + 1] = {
            id = result[i].identifier,
            location = result[i].location,
            type = result[i].type,
            rented = result[i].isrented
          }
        end

        local isPolice = false 
        if xPlayer.job.name == 'police' and xPlayer.job.grade >= Config.PoliceRaidRank then 
          isPolice = true 
          MySQL.Async.fetchAll('SELECT * FROM doughStorage WHERE location = ?', {
            location
          }, function(result2)
            for i=1, #result2, 1 do 
              TriggerEvent('doughStorage:offlineName', result2[i].owner, function(targetName)
                allData[#allData + 1] = {
                  id = result2[i].identifier,
                  location = result2[i].location,
                  type = result2[i].type,
                  rented = result2[i].isrented,
                  owner = result2[i].owner,
                  name = targetName
                }

                if #result2 == #allData then 
                  TriggerClientEvent('doughStorage:client:openUnits', xPlayer.source, location, exportData, isPolice, allData)
                end
              end)
            end
          end)
        end

        if not isPolice then
          TriggerClientEvent('doughStorage:client:openUnits', xPlayer.source, location, exportData, isPolice, allData)
        end
      end
    end)
  end
end)

RegisterNetEvent('doughStorage:server:buyUnit', function(data)
  local _source = source
  local xPlayer = ESX.GetPlayerFromId(_source)
  local identifier = xPlayer.identifier
  if data.isRenting then 
    for i=1, #Config.Locations[data.location].types, 1 do 
      if data.unitType == Config.Locations[data.location].types[i].type then 
        if data.rentPrice == Config.Locations[data.location].types[i].rentPrice then 
          if xPlayer.getAccount(Config.Account).money >= data.rentPrice then 
            MySQL.Async.insert('INSERT INTO doughStorage (owner, location, type, isrented, price) VALUES(@owner, @location, @type, @isrented, @price)', {
              ['@owner'] = identifier, 
              ['@location'] = data.location, 
              ['@type'] = data.unitType, 
              ['@isrented'] = data.isRenting, 
              ['@price'] = data.rentPrice
            }, function(insertID)
              if insertID then 
                xPlayer.removeAccountMoney(Config.Account, data.rentPrice)
                TriggerClientEvent('doughStorage:client:closeError', xPlayer.source, 'You rented a new unit, please come back later')
                DiscordLog('unit bought', xPlayer.identifier .. ' | ' .. xPlayer.getName() .. ' - rented a storage unit [' .. insertID .. ' | ' .. data.rentPrice .. ']')
                TriggerClientEvent('doughStorage:client:registerStash', xPlayer.source, insertID, Config.UnitSettings[data.unitType].label, Config.UnitSettings[data.unitType].size, xPlayer.identifier)
              end
            end)
          else
            xPlayer.triggerEvent('doughStorage:client:sendNotification', Config.Locales.notEnoughMoney)
          end
        else    
          TriggerClientEvent('doughStorage:client:closeError', xPlayer.source, 'Something went wrong with this query')
        end
      end
    end
  elseif not data.isRenting then 
    for i=1, #Config.Locations[data.location].types, 1 do 
      if data.unitType == Config.Locations[data.location].types[i].type then 
        if data.buyPrice == Config.Locations[data.location].types[i].buyPrice then 
          if xPlayer.getAccount(Config.Account).money >= data.buyPrice then 
            MySQL.Async.insert('INSERT INTO doughStorage (owner, location, type, isrented, price) VALUES (@owner, @location, @type, @isrented, @price)', {
              ['@owner'] = identifier, 
              ['@location'] = data.location, 
              ['@type'] = data.unitType, 
              ['@isrented'] = data.isRenting, 
              ['@price'] = data.buyPrice
            }, function(insertID)
              if insertID then 
                xPlayer.removeAccountMoney(Config.Account, data.buyPrice)
                TriggerClientEvent('doughStorage:client:closeError', xPlayer.source, 'You purchased a new unit, please come back later')
                DiscordLog('unit bought', xPlayer.identifier .. ' | ' .. xPlayer.getName() .. ' - purchased a storage unit [' .. insertID .. ' | ' .. data.buyPrice .. ']')
                TriggerClientEvent('doughStorage:client:registerStash', xPlayer.source, insertID, Config.UnitSettings[data.unitType].label, Config.UnitSettings[data.unitType].size, xPlayer.identifier)
              end
            end)
          else
            xPlayer.triggerEvent('doughStorage:client:sendNotification', Config.Locales.notEnoughMoney)
          end
        else    
          TriggerClientEvent('doughStorage:client:closeError', xPlayer.source, 'Something went wrong with this query')
        end
      end
    end
  end
end)

RegisterNetEvent('doughStorage:server:sellUnit', function(data)
  local _source = source
  local xPlayer = ESX.GetPlayerFromId(_source)
  local identifier = xPlayer.identifier
  if identifier == data.owner then
    local sellPrice = ESX.Math.Round(data.price * (1 - (Config.SellDecrease / 100)))
    MySQL.Async.execute('DELETE FROM doughStorage WHERE identifier = ?', {data.identifier}, function(affectedRows)
      xPlayer.addAccountMoney(Config.Account, sellPrice)
      TriggerClientEvent('doughStorage:client:closeError', xPlayer.source, 'You sold a unit! Welcome back')
      DiscordLog('unit sold', xPlayer.identifier .. ' | ' .. xPlayer.getName() .. ' - sold a storage unit [' .. data.identifier .. ' | ' .. sellPrice .. ']')
    end)
  else    
    TriggerClientEvent('doughStorage:client:closeError', xPlayer.source, 'Something went wrong with this query')
  end
end)

RegisterNetEvent('doughStorage:server:fetchUnitsFromId', function(_target)
  local _source = source
  local xPlayer = ESX.GetPlayerFromId(_source)
  local xTarget = ESX.GetPlayerFromId(_target)
  local msgString = "Owned Units: "
  MySQL.Async.fetchAll('SELECT * FROM doughStorage WHERE owner = ?', {xTarget.identifier}, function(result)
    for i=1, #result, 1 do 
      msgString = msgString .. '[' .. Config.Locations[result[i].location].label .. ' (' .. result[i].identifier .. ')] '
    end 

    print('[^1 ' .. xPlayer.getName() .. ' ^0|^1 ' .. xPlayer.identifier .. ' ^0] requested unit information from [^1 ' .. xTarget.getName() .. ' ^0|^1 ' .. xTarget.identifier .. ' ^0]')
    DiscordLog('police request', xPlayer.getName() .. ' ^0|^1 ' .. xPlayer.identifier .. ' ^0] requested unit information from [^1 ' .. xTarget.getName() .. ' ^0|^1 ' .. xTarget.identifier)
    xPlayer.triggerEvent('chat:addMessage', msgString)
  end)
end)

ESX.RegisterServerCallback('doughStorage:server:sanityOwner', function(source, callback, id)
  local _source = source
  local xPlayer = ESX.GetPlayerFromId(_source)
  local identifier = xPlayer.identifier
  MySQL.Async.fetchAll('SELECT * FROM doughStorage WHERE identifier = ? AND owner = ?', {id, identifier}, function(result)
    if result then 
      callback(result[1])
    else
      callback(false)
    end
  end)
end)

ESX.RegisterServerCallback('doughStorage:server:sanityPolice', function(source, callback, id)
  local _source = source
  local xPlayer = ESX.GetPlayerFromId(_source)
  if xPlayer.job.name == 'police' and xPlayer.job.grade >= Config.PoliceRaidRank then
    local identifier = xPlayer.identifier
    MySQL.Async.fetchAll('SELECT * FROM doughStorage WHERE identifier = ?', {id}, function(result)
      if result then 
        print('[^1 ' .. xPlayer.getName() .. ' ^0|^1 ' .. xPlayer.identifier .. ' ^0] is raiding storage unit [^1 ' .. id .. ' ^0]')
        DiscordLog('police raid', xPlayer.identifier .. ' | ' .. xPlayer.getName() .. ' | ' .. xPlayer.job.name .. '[' .. xPlayer.job.grade .. '] - is raiding a storage unit [' .. result[1].identifier .. '] [' .. result[1].owner .. ']')
        callback(result[1])
      else
        callback(false)
      end
    end)
  end
end)

RentFunction = function() 
  if Config.RentInterval == 'restart' or tonumber(Config.RentInterval) then 
    MySQL.Async.fetchAll('SELECT * FROM doughStorage', {}, function(result)
      for i=1, #result, 1 do 
        if result[i].isrented == 1 then
          local xPlayer = ESX.GetPlayerFromIdentifier(result[i].owner)
          if xPlayer then 
            xPlayer.removeAccountMoney(Config.Account, result[i].price)
            xPlayer.triggerEvent('doughStorage:client:sendNotification', Config.Locales.youPaidRent .. ' [ ' .. result[i].price .. ' | (' .. result[i].identifier .. ') ]')
          else
            MySQL.Async.fetchScalar('SELECT accounts FROM users WHERE identifier = ?', {result[i].owner}, function(result2)
              local accounts = json.decode(result2)
              accounts[Config.Account] = accounts[Config.Account] - result[i].price
              MySQL.Async.execute('UPDATE users SET accounts = ? WHERE identifier = ?', {json.encode(accounts), result[i].owner})
            end)
          end
        end
      end

      print('^2Paid all rents ^0')
    end)

    if tonumber(Config.RentInterval) then 
      Citizen.SetTimeout(Config.RentInterval * (60 * 1000), function()
        RentFunction()
      end)
    end
  else 
    print('^1There was a error starting the rent function ^0')
  end
end

RentFunction()

AddEventHandler('doughStorage:offlineName', function(identifier, callback)
  MySQL.Async.fetchAll('SELECT firstname, lastname FROM users WHERE identifier = ?', {identifier}, function(result)
    local targetName = result[1].firstname .. ' ' .. result[1].lastname  
    callback(targetName)
  end)
end)