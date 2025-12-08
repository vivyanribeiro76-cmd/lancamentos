import { redirect } from "next/navigation"

export default function Home() {
  redirect("/gestor/login")
  return null
}
