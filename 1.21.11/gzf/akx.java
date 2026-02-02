import org.jspecify.annotations.Nullable;

public record akx(int b, @Nullable alb c) implements aay<akw> {
   public static final aao<wx, akx> a = aay.a(akx::c, akx::a);
   private static final int d = 1048576;

   public akx(int param1, @Nullable alb param2) {
      this.b = $$0;
      this.c = $$1;
   }

   private static akx a(wx $$0) {
      int $$1 = $$0.l();
      return new akx($$1, a($$1, $$0));
   }

   private static alb a(int $$0, wx $$1) {
      return b($$1);
   }

   private static alb b(wx $$0) {
      int $$1 = $$0.readableBytes();
      if ($$1 >= 0 && $$1 <= 1048576) {
         $$0.k($$1);
         return ald.a;
      } else {
         throw new IllegalArgumentException("Payload may not be larger than 1048576 bytes");
      }
   }

   private void c(wx $$0) {
      $$0.c(this.b);
      $$0.a((Object)this.c, (aaq)(($$0x, $$1) -> {
         $$1.a($$0x);
      }));
   }

   public aba<akx> a() {
      return aku.f;
   }

   public void a(akw $$0) {
      $$0.a(this);
   }

   public int b() {
      return this.b;
   }

   @Nullable
   public alb e() {
      return this.c;
   }
}
