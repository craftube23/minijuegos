Add-Type -AssemblyName System.Drawing

$logoPath = "public\assets\logos\Feria-magica-del-jugete-sin-fondo.png"
if (-not (Test-Path $logoPath)) {
    Write-Error "Logo no encontrado: $logoPath"
    exit 1
}

$srcImg = [System.Drawing.Bitmap]::FromFile((Get-Item $logoPath).FullName)

function Create-Icon($width, $height, $scalePercent, $isRound, $hasBg) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    if ($hasBg) {
        $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 7, 17, 30))
        if ($isRound) {
            $g.FillEllipse($bgBrush, 0, 0, $width, $height)
        } else {
            $g.FillRectangle($bgBrush, 0, 0, $width, $height)
        }
        $bgBrush.Dispose()
    }

    # Calculate centered logo placement
    $logoW = [int]($width * ($scalePercent / 100.0))
    $ratio = $srcImg.Height / [double]$srcImg.Width
    $logoH = [int]($logoW * $ratio)
    if ($logoH -gt [int]($height * ($scalePercent / 100.0))) {
        $logoH = [int]($height * ($scalePercent / 100.0))
        $logoW = [int]($logoH / $ratio)
    }

    $destX = [int](($width - $logoW) / 2.0)
    $destY = [int](($height - $logoH) / 2.0)

    $g.DrawImage($srcImg, $destX, $destY, $logoW, $logoH)
    $g.Dispose()
    return $bmp
}

$densities = @(
    @{ Name = "mipmap-mdpi"; Size = 48; FgSize = 108 },
    @{ Name = "mipmap-hdpi"; Size = 72; FgSize = 162 },
    @{ Name = "mipmap-xhdpi"; Size = 96; FgSize = 216 },
    @{ Name = "mipmap-xxhdpi"; Size = 144; FgSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; Size = 192; FgSize = 432 }
)

foreach ($d in $densities) {
    $dir = Join-Path "android\app\src\main\res" $d.Name
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }

    # 1. ic_launcher.png (legacy square)
    $iconBmp = Create-Icon $d.Size $d.Size 85 $false $true
    $iconBmp.Save((Join-Path $dir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $iconBmp.Dispose()

    # 2. ic_launcher_round.png (round legacy)
    $roundBmp = Create-Icon $d.Size $d.Size 80 $true $true
    $roundBmp.Save((Join-Path $dir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $roundBmp.Dispose()

    # 3. ic_launcher_foreground.png (adaptive foreground transparent, safe zone 66%)
    $fgBmp = Create-Icon $d.FgSize $d.FgSize 68 $false $false
    $fgBmp.Save((Join-Path $dir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $fgBmp.Dispose()

    Write-Host "Generados iconos para $($d.Name)"
}

# Generar Splash Screens
$splashes = @(
    @{ Name = "drawable-port-mdpi"; W = 320; H = 480 },
    @{ Name = "drawable-port-hdpi"; W = 480; H = 800 },
    @{ Name = "drawable-port-xhdpi"; W = 720; H = 1280 },
    @{ Name = "drawable-port-xxhdpi"; W = 960; H = 1600 },
    @{ Name = "drawable-port-xxxhdpi"; W = 1280; H = 1920 }
)

foreach ($s in $splashes) {
    $dir = Join-Path "android\app\src\main\res" $s.Name
    if (Test-Path $dir) {
        $splashBmp = Create-Icon $s.W $s.H 60 $false $true
        $splashBmp.Save((Join-Path $dir "splash.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $splashBmp.Dispose()
        Write-Host "Generado splash para $($s.Name)"
    }
}

$srcImg.Dispose()
Write-Host "Todos los iconos y splash screens generados exitosamente!"
