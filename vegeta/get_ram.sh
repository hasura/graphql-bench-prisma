#!/bin/bash

for ((i=0; i<$1; i+=5));
do
	sleep 3;
	echo `date` "||" `free --mega | grep Mem | awk '{print $3}'` "||" `docker stats --format "{{.Name}} -- {{.MemUsage}}" --no-stream --no-trunc`;
done
