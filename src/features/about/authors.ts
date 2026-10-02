export interface Author {
  photo: string
  name: string
  /** Nombre corto para créditos compactos (sidebar). */
  shortName: string
  code: string
  url: string
}

export const AUTHORS: Author[] = [
  {
    photo: '/orlando-beltran.jpeg',
    name: 'Orlando José Beltrán Valero',
    shortName: 'Orlando Beltrán',
    code: '1152167',
    url: 'https://github.com/DevOB31',
  },
  {
    photo: 'https://www.byandrev.dev/assets/andres-parra.jpg',
    name: 'Andrés Alfonso Parra Garzón',
    shortName: 'Andrés Parra',
    code: '1152185',
    url: 'https://www.byandrev.dev/',
  },
  {
    photo: 'https://avatars.githubusercontent.com/u/114622930?v=4',
    name: 'Alessandro Umberto Daniele Saltarín',
    shortName: 'Alessandro Daniele',
    code: '1152194',
    url: 'https://github.com/AlessandroDani',
  },
]
