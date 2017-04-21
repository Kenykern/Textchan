# Textchan
Textchan is a lightweight textboard written in NodeJS (I know, eww, but I don't like PHP)

## Setup
To run Textchan, make sure you have NodeJS and MongoDB installed, then go into the root directory
of the Textchan instance, run `npm install`, then run `node textchan.js`.

You also may change `config.json` to how you wish

## Creating a Board
To create a board, run `mongo` , enter `use textchan`, then use the following template to create the board: `db.boards.insert({code: "a", name: "Anime", description: "Talk about anime"})`
