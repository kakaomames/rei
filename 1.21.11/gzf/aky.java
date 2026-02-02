import java.util.UUID;

public record aky(String b, UUID c) implements aay<akw> {
   public static final aao<wx, aky> a = aay.a(aky::a, aky::new);

   private aky(wx $$0) {
      this($$0.d(16), $$0.n());
   }

   public aky(String param1, UUID param2) {
      this.b = $$0;
      this.c = $$1;
   }

   private void a(wx $$0) {
      $$0.a((String)this.b, 16);
      $$0.a(this.c);
   }

   public aba<aky> a() {
      return aku.g;
   }

   public void a(akw $$0) {
      $$0.a(this);
   }

   public String b() {
      return this.b;
   }

   public UUID e() {
      return this.c;
   }
}
