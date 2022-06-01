fx_version 'cerulean'
game 'gta5'

author '.dough#0001'
description 'Storage Units'
version '1.1.0'

shared_scripts {
    'shared/config.lua'
}

server_scripts {
	'@async/async.lua',
	'@mysql-async/lib/MySQL.lua',
    '@es_extended/locale.lua',
    'server/main.lua',
    'server/config.lua',
    'server/discord.lua'
}

client_scripts {
    'client/main.lua',
    'client/config.lua',
}

ui_page 'html/public/index.html'

files {
    'html/public/index.html',
    'html/public/global.css',
    'html/public/config.js',
    'html/public/build/bundle.css',
    'html/public/build/bundle.js',
    'html/public/build/bundle.js.map',
}

lua54 'yes'