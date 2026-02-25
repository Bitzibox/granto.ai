'use client'

import Link from 'next/link'
import { Settings, FileText, Bell, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ParametresPage() {
  const sections = [
    {
      title: 'Personnalisation des rapports',
      description: 'Configurez vos templates PDF et personnalisez l\'apparence de vos dossiers de subvention',
      icon: FileText,
      href: '/parametres/templates',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: 'Notifications',
      description: 'Gérez vos préférences de notifications et alertes pour les échéances et événements importants',
      icon: Bell,
      href: '/parametres/notifications',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      borderColor: 'border-purple-200 dark:border-purple-800'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Paramètres
        </h1>
        <p className="text-muted-foreground">
          Personnalisez votre expérience Granto et gérez vos préférences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <Card className={`border-2 ${section.borderColor} ${section.bgColor} hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${section.bgColor} border ${section.borderColor}`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <ChevronRight className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <CardTitle className="text-xl mt-4">{section.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`text-sm font-medium ${section.color} flex items-center gap-2`}>
                    Configurer
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
