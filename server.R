library("plumber")
#install.packages("plumber")
#load.lib<-c("plumber")
setwd("D:/voice_gender_recognition")
pr <- plumber::plumb("api.R")
pr$run(port=8000)


