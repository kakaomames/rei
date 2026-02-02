import java.util.UUID;

public record acb(UUID b, acb.a c) implements aay<abv> {
   public static final aao<wx, acb> a = aay.a(acb::a, acb::new);

   private acb(wx $$0) {
      this($$0.n(), (acb.a)$$0.b(acb.a.class));
   }

   public acb(UUID param1, acb.a param2) {
      this.b = $$0;
      this.c = $$1;
   }

   private void a(wx $$0) {
      $$0.a(this.b);
      $$0.a((Enum)this.c);
   }

   public aba<acb> a() {
      return abu.r;
   }

   public void a(abv $$0) {
      $$0.a(this);
   }

   public UUID b() {
      return this.b;
   }

   public acb.a e() {
      return this.c;
   }

   public static enum a {
      a,
      b,
      c,
      d,
      e,
      f,
      g,
      h;

      public boolean a() {
         return this != d && this != e;
      }

      // $FF: synthetic method
      private static acb.a[] b() {
         return new acb.a[]{a, b, c, d, e, f, g, h};
      }
   }
}
