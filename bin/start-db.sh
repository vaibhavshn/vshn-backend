#!/bin/bash

sudo systemctl start docker
docker-compose -f database.yml up
