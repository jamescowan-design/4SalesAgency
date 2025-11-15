import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";

export default function LeadDetail() {
  const params = useParams();
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Link href="/clients">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-8">Lead #{params.id}</h1>
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  );
}
