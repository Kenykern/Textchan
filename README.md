# Textchan
Textchan is a lightweight textboard written in NodeJS (I know, eww, but I don't like PHP)

## Setup
To run Textchan, make sure you have NodeJS and MongoDB installed, then go into the root directory
of the Textchan instance, run `npm install`, then run `node textchan.js`.

You also may change `config.json` to how you wish

## Creating a Board
To create a board, login to the admin panel at `http://yoururl/admin/login`, supply the password as specified in
`config.json` as `staffPassword`, and you will be presented with the admin panel. From there, fill out the "Create Board"
form with your wanted data.
