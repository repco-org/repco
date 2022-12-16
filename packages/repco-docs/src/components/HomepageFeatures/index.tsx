import clsx from 'clsx'
import React from 'react'
import styles from './styles.module.css'

type FeatureItem = {
  title: string
  // Svg: React.ComponentType<React.ComponentProps<'svg'>>
  description: JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Replication & Collection',
    //Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Repco is intended to promote better exchange between different producers
        of community media, facilitate replication, sharing, and assist in
        curating the contributions to be published.
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    // Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        REPCO ensure a rights-based, people-centred alternative to commercial
        platforms in sense of Europe’s digital sovereignty: namely, diversity
        and openness, transparency and accountability, competition and the
        public wealth, and individual rights and collective purposes.
      </>
    ),
  },
  {
    title: 'Community focused',
    //  Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        We want the vision of a European Digital Public Space to be discussed
        and realised in concrete terms as a network of platforms run by civil
        society.
      </>
    ),
  },
]

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
