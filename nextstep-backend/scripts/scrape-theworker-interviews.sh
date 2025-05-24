#!/bin/bash


currentDirectoryPath=$(dirname $0)
interviewsOutputDirectory=$currentDirectoryPath/../assets/job-quizzes/theworker/interviews
mkdir -p $interviewsOutputDirectory

for ((i = 1 ; i <= 2549 ; i++ )); do
    wget https://www.theworker.co.il/interviews/page/$i -O $interviewsOutputDirectory/$i.html;
done

