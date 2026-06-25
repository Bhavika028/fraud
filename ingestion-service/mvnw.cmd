@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.2.0
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_SAVE_ERRORLEVEL__=
@SET __MVNW_SAVE_ERRORLEVEL__=%ERRORLEVEL%
@REM -------------------------------------------------------------------------
@REM Windows CMD block for detecting Java and running the wrapper
@REM -------------------------------------------------------------------------

@SETLOCAL

@SET MAVEN_PROJECTBASEDIR=%~dp0
@IF NOT "%MAVEN_BASEDIR%"=="" @SET MAVEN_PROJECTBASEDIR=%MAVEN_BASEDIR%
@IF NOT "%MAVEN_BASEDIR%"=="" goto endDetectBaseDir

@SET EXEC_DIR=%CD%
@SET WDIR=%MAVEN_PROJECTBASEDIR%
:findBaseDir
@IF EXIST "%WDIR%"\.mvn goto baseDirFound
@CD ..
@IF "%WDIR%"=="%CD%" goto baseDirNotFound
@SET WDIR=%CD%
@goto findBaseDir

:baseDirNotFound
@SET MAVEN_PROJECTBASEDIR=%EXEC_DIR%
@CD "%EXEC_DIR%"
@goto endDetectBaseDir

:baseDirFound
@SET MAVEN_PROJECTBASEDIR=%WDIR%
@CD "%EXEC_DIR%"

:endDetectBaseDir

@SET MAVEN_PROJECTBASEDIR_CLEAN=%MAVEN_PROJECTBASEDIR%
@IF "%MAVEN_PROJECTBASEDIR_CLEAN:~-1%"=="\" SET MAVEN_PROJECTBASEDIR_CLEAN=%MAVEN_PROJECTBASEDIR_CLEAN:~0,-1%

@IF NOT EXIST "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties" (
  @ECHO Could not find .mvn\wrapper\maven-wrapper.properties
)

@SET JAVA_HOME_HINT=
@IF NOT "%JAVA_HOME%"=="" @SET JAVA_HOME_HINT=%JAVA_HOME%

@SET FOUND_JAVA=0
@IF NOT "%JAVA_HOME_HINT%"=="" @IF EXIST "%JAVA_HOME_HINT%\bin\java.exe" (
  @SET JAVA_CMD="%JAVA_HOME_HINT%\bin\java.exe"
  @SET FOUND_JAVA=1
)
@IF NOT %FOUND_JAVA%==1 (
  @for /f "tokens=*" %%f in ('where java 2^>nul') do (
    @SET JAVA_CMD="%%f"
    @SET FOUND_JAVA=1
    @goto :foundJava
  )
)
:foundJava

@IF NOT %FOUND_JAVA%==1 (
  @ECHO ERROR: JAVA_HOME not found and java is not in PATH.
  @ECHO Please install Java 17 or higher from https://adoptium.net/
  @EXIT /B 1
)

@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain
@SET DOWNLOAD_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar

@SET WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
@IF NOT EXIST %WRAPPER_JAR% (
  @ECHO Downloading maven-wrapper.jar ...
  @%JAVA_CMD% -cp "" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
    -Dmaven.wrapper.launcher="%WRAPPER_LAUNCHER%" ^
    -Dmaven.home= ^
    org.apache.maven.wrapper.Downloader ^
    "%DOWNLOAD_URL%" %WRAPPER_JAR% 2>nul
  @IF NOT EXIST %WRAPPER_JAR% (
    @%JAVA_CMD% -cp "" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" ^
      -Dlog.level=FATAL ^
      "-Dmaven.home=" ^
      -classpath "" ^
      "org.apache.maven.wrapper.Downloader" ^
      "%DOWNLOAD_URL%" %WRAPPER_JAR% 2>nul
  )
)

@REM If we still don't have the jar, try downloading with PowerShell
@IF NOT EXIST %WRAPPER_JAR% (
  PowerShell -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile %WRAPPER_JAR%"
)

%JAVA_CMD% ^
  "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR_CLEAN%" ^
  %MAVEN_OPTS% %MAVEN_DEBUG_OPTS% ^
  -classpath %WRAPPER_JAR% ^
  "-Dmaven.home=" ^
  %WRAPPER_LAUNCHER% %MAVEN_CONFIG% %*

@SET __MVNW_ERROR__=%ERRORLEVEL%
@ENDLOCAL
@EXIT /B %__MVNW_ERROR__%
