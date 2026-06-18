$content = Get-Content -Path "src/pages/Landing.tsx" -Raw

# Replace Design Tokens
$oldTokens = @"
const C = {
  bg: '#020617',         // Slate 950
  bgDeep: '#0f172a',     // Slate 900
  bgDeeper: '#010409',   // Near black
  bgCard: '#1e293b',     // Slate 800
  bgCardLight: '#334155', // Slate 700
  palladian: '#f8fafc',  // Slate 50
  oatmeal: '#94a3b8',    // Slate 400
  oatmealDim: '#64748b', // Slate 500
  gold: '#FBBF24',      // Vibrant Gold (Amber 400)
  goldBright: '#FDE047', // Yellow 300
  copper: '#D97706',     // Amber 600
  copperLight: '#F59E0B', // Amber 500
  // CTA gradients
  gradientCta: 'linear-gradient(135deg, #D97706 0%, #F59E0B 35%, #FBBF24 75%, #FDE047 100%)',
  gradientCtaHov: 'linear-gradient(135deg, #B45309 0%, #D97706 35%, #F59E0B 75%, #FBBF24 100%)',
  borderSubtle: 'rgba(148, 163, 184, 0.12)',
  borderCard: 'rgba(148, 163, 184, 0.08)',
  // Glows updated to Amber
  glowHero: 'radial-gradient(ellipse 900px 600px at 50% 50%, rgba(251,191,36,0.12) 0%, rgba(15,23,42,0.0) 75%)',
  glowBA: 'radial-gradient(ellipse 1200px 400px at 50% 60%, rgba(251,191,36,0.08) 0%, transparent 75%)',
  glowFooter: 'radial-gradient(ellipse 800px 500px at 50% 40%, rgba(251,191,36,0.15) 0%, transparent 70%)',
  glowCard: '0 0 40px rgba(251,191,36,0.1)',
};
"@

$newTokens = @"
const C = {
  bg: '#0f0a1e',         // Deep Violet Slate
  bgDeep: '#160e2a',     // Deep Violet
  bgDeeper: '#0b0715',   // Near black violet
  bgCard: 'rgba(255, 255, 255, 0.03)', // Glass base
  bgCardLight: 'rgba(255, 255, 255, 0.05)',
  palladian: '#f8fafc',
  oatmeal: '#a78bfa',    // Light Purple
  oatmealDim: '#8b5cf6', // Violet 500
  gold: '#7c3aed',       // Primary Violet
  goldBright: '#8b5cf6',
  copper: '#6d28d9',     // Violet 700
  copperLight: '#7c3aed',
  // CTA gradients
  gradientCta: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 35%, #8b5cf6 75%, #a78bfa 100%)',
  gradientCtaHov: 'linear-gradient(135deg, #5b21b6 0%, #6d28d9 35%, #7c3aed 75%, #8b5cf6 100%)',
  borderSubtle: 'rgba(255, 255, 255, 0.1)',
  borderCard: 'rgba(255, 255, 255, 0.05)',
  // Glows updated to Violet
  glowHero: 'radial-gradient(ellipse 900px 600px at 50% 50%, rgba(124,58,237,0.15) 0%, rgba(15,10,30,0.0) 75%)',
  glowBA: 'radial-gradient(ellipse 1200px 400px at 50% 60%, rgba(124,58,237,0.12) 0%, transparent 75%)',
  glowFooter: 'radial-gradient(ellipse 800px 500px at 50% 40%, rgba(124,58,237,0.15) 0%, transparent 70%)',
  glowCard: '0 0 40px rgba(124,58,237,0.15)',
};
"@

$content = $content.Replace($oldTokens, $newTokens)

# Replace Box Shadow
$oldShadow = @"
          // Rich metallic glow
          boxShadow: hov
            ? '0 0 0 1px rgba(201,174,126,0.5), 0 8px 40px rgba(163,81,57,0.60), 0 0 80px rgba(163,81,57,0.25)'
            : '0 0 0 1px rgba(179,155,111,0.25), 0 6px 28px rgba(163,81,57,0.45), 0 0 50px rgba(163,81,57,0.15)',
"@
$newShadow = @"
          // Rich violet glow
          boxShadow: hov
            ? '0 0 0 1px rgba(167,139,250,0.5), 0 8px 40px rgba(124,58,237,0.60), 0 0 80px rgba(124,58,237,0.25)'
            : '0 0 0 1px rgba(139,92,246,0.25), 0 6px 28px rgba(124,58,237,0.45), 0 0 50px rgba(124,58,237,0.15)',
"@
$content = $content.Replace($oldShadow, $newShadow)

# Replace Fonts for Headings (h1, h2, h3, spans with KANBA)
$content = $content -replace "(<h[1-6][^>]*>[\s\S]*?fontFamily:\s*\"')Inter(',sans-serif\")", "`$1Poppins`$2"
$content = $content -replace "(<span[^>]*>[\s\S]*?fontFamily:\s*\"')Inter(',sans-serif\"[\s\S]*?KANBA\s*</span>)", "`$1Poppins`$2"
$content = $content -replace "(<p[^>]*Eyebrow[\s\S]*?fontFamily:\s*\"')Inter(',sans-serif\")", "`$1Poppins`$2"

# Specific explicit replaces if regex fails
$content = $content.Replace("fontFamily: `"'Inter`",sans-serif`", fontWeight: 700, fontSize: `'1.5rem`', letterSpacing: `'0.14em`'", "fontFamily: `"'Poppins`",sans-serif`", fontWeight: 700, fontSize: `'1.5rem`', letterSpacing: `'0.14em`'")
$content = $content.Replace("fontFamily: `"'Inter`",sans-serif`",`n            fontWeight: 800,`n            fontSize: `'clamp(2.5rem, 6vw, 5rem)`'", "fontFamily: `"'Poppins`",sans-serif`",`n            fontWeight: 800,`n            fontSize: `'clamp(2.5rem, 6vw, 5rem)`'")
$content = $content.Replace("<h2 style={{`n            fontFamily: `"'Inter`",sans-serif`",", "<h2 style={{`n            fontFamily: `"'Poppins`",sans-serif`",")
$content = $content.Replace("<h3 style={{ fontFamily: `"'Inter`",sans-serif`", fontWeight: 700, color: `'#E05A4C`'", "<h3 style={{ fontFamily: `"'Poppins`",sans-serif`", fontWeight: 700, color: `'#E05A4C`'")
$content = $content.Replace("<h3 style={{ margin: `'0 0 10px`', fontFamily: `"'Inter`",sans-serif`", fontWeight: 700, fontSize: `'1.15rem`'", "<h3 style={{ margin: `'0 0 10px`', fontFamily: `"'Poppins`",sans-serif`", fontWeight: 700, fontSize: `'1.15rem`'")
$content = $content.Replace("<p style={{ textAlign: `'center`', fontSize: `'0.68rem`', color: C.gold, letterSpacing: `'0.2em`', fontFamily: `"'Inter`",sans-serif`"", "<p style={{ textAlign: `'center`', fontSize: `'0.68rem`', color: C.gold, letterSpacing: `'0.2em`', fontFamily: `"'Poppins`",sans-serif`"")
$content = $content.Replace("<h3 style={{ fontFamily: `"'Inter`",sans-serif`", fontWeight: 700, color: C.gold,", "<h3 style={{ fontFamily: `"'Poppins`",sans-serif`", fontWeight: 700, color: C.gold,")

Set-Content -Path "src/pages/Landing.tsx" -Value $content
