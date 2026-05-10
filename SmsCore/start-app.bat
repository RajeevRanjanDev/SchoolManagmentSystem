@echo off
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot
set PATH=%JAVA_HOME%\bin;C:\tools\maven\bin;%PATH%
cd /d C:\Users\shipra.k.singh\SMS
C:\tools\maven\bin\mvn.cmd spring-boot:run -Dspring-boot.run.profiles=demo > app-startup.log 2>&1
