import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Mrs. Adebayo",
    role: "Principal, Bright Future High School",
    testimonial:
  "OhmanFoundations has transformed how we manage our school. It's intuitive, powerful, and has saved us countless hours of administrative work.",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    name: "Mr. Okoro",
    role: "Head of IT, Greenfield Academy",
    testimonial:
      "The platform is robust, secure, and easy to integrate. The support team is also fantastic and always ready to help.",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    name: "Dr. Funke",
    role: "Parent",
    testimonial:
  "I love how easy it is to keep track of my child's progress and communicate with teachers. OhmanFoundations is a game-changer for parent-school collaboration.",
    avatar: "https://randomuser.me/api/portraits/women/79.jpg",
  },
];

export function Testimonials() {
  return (
    <section className="py-16 px-6">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <p className="font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "{testimonial.testimonial}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
