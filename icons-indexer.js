require('dotenv').config();
const fs = require('fs');
const sharp = require('sharp');
const MongoClient = require('mongodb').MongoClient;

const uri = process.env.DB_URI;
const dbName = process.env.DB_NAME;

const dbClient = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

dbClient
    .connect()
    .then(() => {
        const svgCollection = dbClient.db(dbName).collection('icons-svg');
        const pngCollection = dbClient.db(dbName).collection('icons-png');
        const pathOfsvg = './icons/svgs';
        const pathOfpng = './icons/pngs';

        fs.readdir(pathOfsvg, async (error, files) => {
            if (!error) {
                const svgFiles = files;

                for (const file of svgFiles) {
                    const fileName = file.substr(0, file.indexOf('.'));
                    const recordName = fileName.replace(/-/g, ' ');

                    const converting = sharp(`${pathOfsvg}/${file}`)
                        .png()
                        .toFile(`${pathOfpng}/${fileName}.png`)
                        .catch((error) => console.log(error));

                    const insertingSvg = svgCollection.insertOne({
                        name: recordName,
                        path: `${pathOfsvg}/${fileName}.svg`,
                    });

                    const insertingPng = pngCollection.insertOne({
                        name: recordName,
                        path: `${pathOfpng}/${fileName}.png`,
                    });

                    await Promise.all([converting, insertingSvg, insertingPng]);
                }

                dbClient.close();
            } else {
                console.error(error);
            }
        });
    })
    .catch((error) => console.error(error));
