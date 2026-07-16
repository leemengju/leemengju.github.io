import { motion } from 'framer-motion';

/**
 * Motion tier L2 (see design.md "Progressive motion tiers"): the one Framer
 * Motion island on the site, hydrated with `client:visible` inside the About
 * section. Renders the headline stats as an auto-scrolling marquee carousel
 * (track duplicated ×2, CSS keyframes scroll −50%, pauses on hover) — each
 * value gets a distinct "material" treatment (gradient ink / metallic emboss /
 * hue-shifting / serif / neon mono / extruded 3D) via per-index CSS classes
 * in stats-band.css.
 */
interface Stat {
  value: string;
  label: string;
}

export default function StatsBand({ stats }: { stats: Stat[] }) {
  const track = [...stats, ...stats]; // duplicate for a seamless loop
  return (
    <motion.div
      className="stats-band"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      aria-label="Highlight statistics"
    >
      <ul className="stats-band__track">
        {track.map((stat, i) => (
          <li
            className="stats-band__item"
            key={`${stat.label}-${i}`}
            aria-hidden={i >= stats.length ? true : undefined}
          >
            <span className={`stats-band__value stats-band__value--v${(i % stats.length) % 6}`}>
              {stat.value}
            </span>
            <span className="stats-band__label">{stat.label}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
