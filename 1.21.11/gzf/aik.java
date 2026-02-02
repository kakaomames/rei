import java.time.Instant;
import org.jspecify.annotations.Nullable;

public record aik(String b, Instant c, long d, @Nullable yu e, yp.b f) implements aay<aib> {
   public static final aao<wx, aik> a = aay.a(aik::a, aik::new);

   private aik(wx $$0) {
      this($$0.d(256), $$0.s(), $$0.readLong(), (yu)$$0.c(yu::a), new yp.b($$0));
   }

   public aik(String param1, Instant param2, long param3, @Nullable yu param5, yp.b param6) {
      this.b = $$0;
      this.c = $$1;
      this.d = $$2;
      this.e = $$3;
      this.f = $$4;
   }

   private void a(wx $$0) {
      $$0.a((String)this.b, 256);
      $$0.a(this.c);
      $$0.b(this.d);
      $$0.a((Object)this.e, (aaq)(yu::a));
      this.f.a($$0);
   }

   public aba<aik> a() {
      return ahz.by;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public String b() {
      return this.b;
   }

   public Instant e() {
      return this.c;
   }

   public long f() {
      return this.d;
   }

   @Nullable
   public yu g() {
      return this.e;
   }

   public yp.b h() {
      return this.f;
   }
}
