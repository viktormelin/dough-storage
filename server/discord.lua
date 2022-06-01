DiscordLog = function(title, message)

  local timestamp = os.date("%d-%m-%Y %I:%M %p")
  local embeds = {{
    ["color"] = 3447003,
    ["title"] = title,
    ["description"] = message,
    ["footer"] = {
        ["text"] = timestamp
    },
  }}

  if SendLogs then
    PerformHttpRequest(DiscordWebhook, function(err, text, headers) end, 'POST', json.encode({username = 'doughStorage', embeds = embeds, avatar_url = 'https://imagedelivery.net/3ecvmLCFkS-FijMWb0qFvQ/a41c12c8-5850-4ffc-17de-19ae157b2c00/public'}), { ['Content-Type'] = 'application/json' })
  end
end 