import Link from "next/link";

import styles from "./hyrox-home-entry.module.css";

export function HyroxHomeEntry() {
  return (
    <aside className={styles.entry} aria-labelledby="hyrox-home-title">
      <div>
        <p className={styles.label}>HYROX TRAINING</p>
        <h2 id="hyrox-home-title">HYROXのトレーニング拠点を探す</h2>
        <p>公式トレーニングクラブを、エリアや地図から確認できます。</p>
      </div>
      <Link href="/training/hyrox">HYROXを探す <span aria-hidden="true">→</span></Link>
    </aside>
  );
}
