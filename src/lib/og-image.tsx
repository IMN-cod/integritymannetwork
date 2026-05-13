import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

function getLogoSrc(): string {
  try {
    const buf = readFileSync(
      join(process.cwd(), "public/images/imn-icon-hand-torch-512.png")
    );
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export function buildOgImage({
  title,
  description,
  category,
}: {
  title: string;
  description: string;
  category?: string;
}) {
  const logoSrc = getLogoSrc();
  const fontSize = title.length > 28 ? 60 : title.length > 18 ? 72 : 86;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#09090b",
          padding: "56px 72px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "linear-gradient(90deg, #c2410c, #ea580c, #f97316)",
            display: "flex",
          }}
        />

        {/* Background glow orb */}
        <div
          style={{
            position: "absolute",
            right: "-180px",
            top: "-180px",
            width: "780px",
            height: "780px",
            borderRadius: "390px",
            backgroundColor: "rgba(234, 88, 12, 0.07)",
            display: "flex",
          }}
        />

        {/* Second glow at bottom-left */}
        <div
          style={{
            position: "absolute",
            left: "-100px",
            bottom: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "200px",
            backgroundColor: "rgba(234, 88, 12, 0.04)",
            display: "flex",
          }}
        />

        {/* Header: logo + brand name */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt=""
              width={60}
              height={60}
              style={{ objectFit: "contain" }}
            />
          ) : null}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "16px",
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontSize: "19px",
                fontWeight: 700,
                letterSpacing: "0.07em",
                lineHeight: 1.2,
              }}
            >
              INTEGRITY MAN NETWORK
            </span>
            <span
              style={{
                color: "#ea580c",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.16em",
                lineHeight: 1.2,
              }}
            >
              GOD · WORK · INTEGRITY
            </span>
          </div>
        </div>

        {/* Main content grows to fill space */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "flex-end",
            paddingBottom: "8px",
          }}
        >
          {category ? (
            <span
              style={{
                color: "#ea580c",
                fontSize: "16px",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: "14px",
              }}
            >
              {category}
            </span>
          ) : null}

          <span
            style={{
              color: "#ffffff",
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              lineHeight: 1.08,
              marginBottom: "18px",
              maxWidth: "900px",
            }}
          >
            {title}
          </span>

          <span
            style={{
              color: "#a1a1aa",
              fontSize: "24px",
              lineHeight: 1.45,
              maxWidth: "800px",
            }}
          >
            {description}
          </span>
        </div>

        {/* Footer separator */}
        <div
          style={{
            height: "1px",
            backgroundColor: "rgba(255,255,255,0.12)",
            marginTop: "28px",
            marginBottom: "16px",
            display: "flex",
          }}
        />

        {/* Footer URL */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "4px",
              backgroundColor: "#ea580c",
              marginRight: "12px",
            }}
          />
          <span
            style={{ color: "#ea580c", fontSize: "18px", fontWeight: 600 }}
          >
            www.integritymannetwork.com
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
