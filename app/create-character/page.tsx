import { redirect } from 'next/navigation'

export default function CreateCharacterPage() {
  redirect('/characters?mode=create')
}
