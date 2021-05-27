#!/bin/bash
echo "===================="
echo  "Cleaning build folders"
rm -rf ./build/contents/*
rm -rf ./build/images/*
echo "===================="
echo "Cleaning source tree"
rm -rf ../restedhealthapp/assets/images/*
rm -rf ../restedhealthapp/assets/content/*
rm -rf ../restedhealthapp/assets/images/*
rm -rf ../restedhealthapp/Components/appImages.js
echo "===================="
echo "Extarcting AirTable Contents and Iamges"
node index.js
echo "===================="
echo "Installing build in Application"
cp ./build/images/* ../restedhealthapp/assets/images/.
cp ./build/content/content.json ../restedhealthapp/assets/content/.
cp ./build/content/appImages.js ../restedhealthapp/Components/.
echo "===================="
echo "Done."
echo "===================="
