import { motion } from 'framer-motion';

/**
 * Motion tier L2 (see design.md "Progressive motion tiers"): the one place
 * on the site that uses a Framer Motion island. Deliberately kept separate
 * from the SEO-critical project listing (which stays plain static HTML) —
 * this is a small, supplementary "quantified impact" strip on the home page,
 * hydrated with `client:visible` so it costs nothing until scrolled to.
 */
interface Stat {
  value: string;
  label: string;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } }
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } }
};

export default function StatsBand({ stats }: { stats: Stat[] }) {
  return (
    <motion.ul
      className="stats-band"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      {stats.map((stat) => (
        <motion.li
          key={stat.label}
          className="stats-band__item"
          variants={item}
          whileHover={{ scale: 1.04 }}
        >
          <span className="stats-band__value">{stat.value}</span>
          <span className="stats-band__label">{stat.label}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
