RegisterNetEvent('chezz-inventory:openStorageUnit')
AddEventHandler('chezz-inventory:openStorageUnit', function (id, title, weight)
    OpenInventory({
        type = 'storageUnit', 
        title = title, 
        id = id, 
        weight = weight,
        save = true
    })
end)