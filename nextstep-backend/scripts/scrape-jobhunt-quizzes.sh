#!/bin/bash


currentDirectoryPath=$(dirname $0)
outputDirectory=$currentDirectoryPath/../assets/job-quizzes/jobhunt
mkdir -p $outputDirectory

wget https://jobhunt.co.il/%D7%9E%D7%90%D7%92%D7%A8-%D7%A9%D7%90%D7%9C%D7%95%D7%AA-%D7%9E%D7%A8%D7%90%D7%99%D7%95%D7%A0%D7%95%D7%AA/ -O "$outputDirectory/מאגר שאלות מראיונות עבודה.html"
