import Script from "next/script";

// Google Ads + GA4 + Meta Pixel, all gated on env vars so we can flip them on
// per-environment without redeploying client code.

export function Analytics() {
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID; // e.g. AW-1234567890
  const ga4Id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID; // e.g. G-ABCDE12345
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  const gtagTargets = [googleAdsId, ga4Id].filter(Boolean) as string[];

  return (
    <>
      {gtagTargets.length > 0 && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gtagTargets[0]}`}
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              ${gtagTargets.map((t) => `gtag('config', '${t}');`).join("\n")}
            `}
          </Script>
        </>
      )}
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
