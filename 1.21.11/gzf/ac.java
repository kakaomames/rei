import java.util.List;

public record ac(amo c, ab d) {
   public static final aao<xq, ac> a;
   public static final aao<xq, List<ac>> b;

   public ac(amo param1, ab param2) {
      this.c = $$0;
      this.d = $$1;
   }

   public boolean equals(Object $$0) {
      if (this == $$0) {
         return true;
      } else {
         boolean var10000;
         if ($$0 instanceof ac) {
            ac $$1 = (ac)$$0;
            if (this.c.equals($$1.c)) {
               var10000 = true;
               return var10000;
            }
         }

         var10000 = false;
         return var10000;
      }
   }

   public int hashCode() {
      return this.c.hashCode();
   }

   public String toString() {
      return this.c.toString();
   }

   public amo a() {
      return this.c;
   }

   public ab b() {
      return this.d;
   }

   static {
      a = aao.a(amo.b, ac::a, ab.b, ac::b, ac::new);
      b = a.a(aam.a());
   }
}
