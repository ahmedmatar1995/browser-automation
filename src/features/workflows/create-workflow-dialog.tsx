import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from '@tanstack/react-form'
import { ArrowRight, Workflow } from 'lucide-react'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { insertWorkflowAction } from './actions'
import { toast } from 'sonner'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

const createWorkflowSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name for your workflow'),
})

export function CreateWorkflowDialog({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const navigate = useNavigate()
  const createWorkflow = useMutation({
    mutationFn: async (variables: { name: string }) =>
      await insertWorkflowAction({ data: { name: variables.name } }),
    onSuccess: (data) => {
      toast.success(`Workflow ${data.id} has been created`)
      setOpen(false)
      navigate({ to: '/' })
      router.invalidate()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'something went wrong',
      )
      setOpen(false)
    },
  })
  const form = useForm({
    defaultValues: {
      name: '',
    },
    validators: {
      onSubmit: createWorkflowSchema,
    },
    onSubmit: async ({ value }) => {
      await createWorkflow.mutateAsync({
        name: value.name,
      })
    },
  })
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="overflow-hidden rounded-2xl border border-(--sea-ink-soft) bg-background p-0 shadow-2xl sm:max-w-[460px]">
        <DialogHeader className="border-b border-border/70 bg-muted/20 px-6 pb-5 pt-6 text-left">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-(--sea-ink)/10 text-(--sea-ink)">
            <Workflow className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Create a workflow
          </DialogTitle>
          <DialogDescription className="max-w-sm leading-relaxed">
            Give your workflow a clear name so your team can find it quickly.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-6 px-6 py-6"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={field.name} className="text-sm font-medium">
                    Workflow name
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Required
                  </span>
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  className="h-11 rounded-lg border-border/80 bg-background px-3.5 shadow-xs placeholder:text-muted-foreground/70 focus-visible:border-(--sea-ink) focus-visible:ring-(--sea-ink)/20"
                  placeholder="e.g. Product research"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Use a short, descriptive name that explains what this workflow
                  does.
                </p>
              </div>
            )}
          />
          <DialogFooter className="flex-row justify-end gap-3 border-t border-border/70 pt-5">
            <Button
              type="submit"
              className="min-w-36 rounded-lg bg-background text-white shadow-sm hover:bg-(--sea-ink)/90 hover:text-background"
              disabled={createWorkflow.isPending}
            >
              {createWorkflow.isPending ? 'Creating' : 'Create Workflow'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
