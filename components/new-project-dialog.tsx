'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { projetsAPI, collectivitesAPI } from '@/lib/api'
import { useEffect } from 'react'

const formSchema = z.object({
  titre: z.string().min(1, { message: 'Le titre est obligatoire' }),
  collectiviteId: z.string().min(1, { message: 'La collectivité est obligatoire' }),
  typeProjet: z.string().optional(),
  description: z.string().max(500, { message: 'Maximum 500 caractères' }).optional(),
  montantHt: z.string().optional(),
  montantTtc: z.string().optional(),
  maturite: z.string().optional(),
  calendrierDebut: z.string().optional(),
  calendrierFin: z.string().optional(),
  objectifs: z.string().optional(),
  statut: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function NewProjectDialog() {
  const [open, setOpen] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [collectivites, setCollectivites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titre: '',
      collectiviteId: '',
      typeProjet: '',
      description: '',
      montantHt: '',
      montantTtc: '',
      maturite: '',
      calendrierDebut: '',
      calendrierFin: '',
      objectifs: '',
      statut: 'brouillon',
    },
  })

  useEffect(() => {
    if (open) {
      loadCollectivites()
    }
  }, [open])

  const loadCollectivites = async () => {
    try {
      const data = await collectivitesAPI.getAll()
      setCollectivites(data)
    } catch (error) {
      console.error('Erreur chargement collectivités:', error)
    }
  }

  const watchDescription = form.watch('description')
  const watchMontantHT = form.watch('montantHt')

  // Update character count
  if (watchDescription !== undefined && charCount !== watchDescription.length) {
    setCharCount(watchDescription.length)
  }

  // Auto-calculate TTC when HT changes
  if (watchMontantHT) {
    const ht = Number.parseFloat(watchMontantHT)
    if (!Number.isNaN(ht)) {
      const ttc = (ht * 1.20).toFixed(2)
      if (form.getValues('montantTtc') !== ttc) {
        form.setValue('montantTtc', ttc, { shouldValidate: false })
      }
    }
  }

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const projectData = {
        ...data,
        montantHt: data.montantHt ? parseFloat(data.montantHt) : null,
        montantTtc: data.montantTtc ? parseFloat(data.montantTtc) : null,
        calendrierDebut: data.calendrierDebut ? new Date(data.calendrierDebut).toISOString() : null,
        calendrierFin: data.calendrierFin ? new Date(data.calendrierFin).toISOString() : null,
      }

      await projetsAPI.create(projectData)
      
      toast({
        title: 'Succès',
        description: 'Projet créé avec succès !',
      })
      setOpen(false)
      form.reset()
      
      // Recharger la page pour voir le nouveau projet
      window.location.reload()
    } catch (error) {
      console.error('Erreur création projet:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le projet',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Créer un nouveau projet</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Renseignez les informations principales de votre projet
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Titre du projet */}
            <FormField
              control={form.control}
              name="titre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Titre du projet <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Rénovation de la salle des fêtes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Collectivité */}
            <FormField
              control={form.control}
              name="collectiviteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Collectivité <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une collectivité" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {collectivites.map((coll) => (
                        <SelectItem key={coll.id} value={coll.id}>
                          {coll.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type de projet */}
            <FormField
              control={form.control}
              name="typeProjet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de projet</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="équipement public">Équipement public</SelectItem>
                      <SelectItem value="voirie">Voirie/Mobilité</SelectItem>
                      <SelectItem value="rénovation énergétique">Rénovation énergétique</SelectItem>
                      <SelectItem value="bâtiment public">Bâtiment public</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description du projet</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez votre projet..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500">{charCount}/500 caractères</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Montants */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="montantHt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant HT (€)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="montantTtc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant TTC (€)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Maturité */}
            <FormField
              control={form.control}
              name="maturite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maturité du projet</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="idée">Idée</SelectItem>
                      <SelectItem value="études préliminaires">Études préliminaires</SelectItem>
                      <SelectItem value="études en cours">Études en cours</SelectItem>
                      <SelectItem value="projet défini">Projet défini</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calendrierDebut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début prévue</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calendrierFin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin prévue</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Objectifs */}
            <FormField
              control={form.control}
              name="objectifs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objectifs du projet</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Quels sont les objectifs de ce projet ?"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer le projet'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
