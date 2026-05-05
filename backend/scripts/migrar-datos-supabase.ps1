param(
  [string]$LocalDatabaseUrl = "",
  [string]$SupabaseDirectUrl = "",
  [string]$DumpFile = "datos.sql",
  [switch]$SkipExport,
  [switch]$SkipImport,
  [switch]$TruncateBeforeImport
)

$ErrorActionPreference = "Stop"

function Load-DotEnv {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    return
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()

    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
      return
    }

    $key, $value = $line.Split("=", 2)
    $key = $key.Trim()
    $value = $value.Trim().Trim('"').Trim("'")

    if ($key -and -not [Environment]::GetEnvironmentVariable($key, "Process")) {
      [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
  }
}

function Require-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "No se encontro '$Name'. Instala PostgreSQL tools o agrega la carpeta bin de PostgreSQL al PATH."
  }
}

function Run-Command {
  param(
    [string]$Name,
    [string[]]$Arguments,
    [string]$ErrorMessage
  )

  & $Name @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw $ErrorMessage
  }
}

$backendDir = Split-Path -Parent $PSScriptRoot
Load-DotEnv (Join-Path $backendDir ".env")

if (-not $LocalDatabaseUrl) {
  $LocalDatabaseUrl = $env:DATABASE_URL_LOCAL
}

if (-not $LocalDatabaseUrl) {
  $LocalDatabaseUrl = $env:DATABASE_URL
}

if (-not $SupabaseDirectUrl) {
  $SupabaseDirectUrl = $env:DIRECT_URL_SUPABASE
}

if (-not $SupabaseDirectUrl) {
  $SupabaseDirectUrl = $env:DIRECT_URL
}

if (-not $LocalDatabaseUrl) {
  throw "Falta DATABASE_URL local. Define DATABASE_URL en backend/.env o pasa -LocalDatabaseUrl."
}

if (-not $SkipImport -and -not $SupabaseDirectUrl) {
  throw "Falta DIRECT_URL de Supabase. Define DIRECT_URL en backend/.env o pasa -SupabaseDirectUrl."
}

if (-not $SkipImport -and $SupabaseDirectUrl -match "pooler|6543") {
  Write-Warning "La URL de Supabase parece ser pooler. Para importar datos usa DIRECT_URL, normalmente puerto 5432."
}

Require-Command "pg_dump"
Require-Command "psql"

$dumpPath = if ([System.IO.Path]::IsPathRooted($DumpFile)) {
  $DumpFile
} else {
  Join-Path $backendDir $DumpFile
}

if (-not $SkipExport) {
  Write-Host "Exportando datos locales a $dumpPath..."
  Run-Command "pg_dump" @(
    $LocalDatabaseUrl,
    "--data-only",
    "--column-inserts",
    "--file",
    $dumpPath
  ) "Fallo la exportacion desde PostgreSQL local. Revisa DATABASE_URL y que la base local este disponible."
}

if (-not $SkipImport) {
  if ($TruncateBeforeImport) {
    Write-Host "Limpiando tablas publicas en Supabase antes de importar..."
    Run-Command "psql" @(
      $SupabaseDirectUrl,
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      "DO `$`$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations') LOOP EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', r.tablename); END LOOP; END `$`$;"
    ) "Fallo la limpieza de tablas en Supabase. Revisa DIRECT_URL y permisos."
  }

  Write-Host "Importando datos en Supabase desde $dumpPath..."
  Run-Command "psql" @(
    $SupabaseDirectUrl,
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    $dumpPath
  ) "Fallo la importacion en Supabase. Revisa DIRECT_URL, tablas existentes y datos duplicados."
}

Write-Host "Migracion de datos completada."
